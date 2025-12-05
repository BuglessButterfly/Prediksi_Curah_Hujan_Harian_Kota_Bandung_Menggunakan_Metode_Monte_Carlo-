# app.py
import os
import pandas as pd
import numpy as np
import random
from flask import Flask, render_template, request

app = Flask(__name__)

# ==========================================================
# KONFIGURASI
# ==========================================================
DATA_FILE = "curah_hujan_di_kota_bandung.csv"
HANDLE_OUTLIER = False      # True kalau mau membatasi outlier ekstrem (2021)
RANDOM_SEED = 42


# ==========================================================
# 1. FILTER JINJA2
# ==========================================================
def format_ribuan(value):
    """
    Format angka curah hujan: ribuan + 2 desimal.
    """
    try:
        return f"{float(value):,.2f}"
    except (ValueError, TypeError):
        return value

app.jinja_env.filters["format_ribuan"] = format_ribuan


# ==========================================================
# 2. LOGIKA MONTE CARLO
# ==========================================================
def run_monte_carlo_prediction(num_simulations: int):
    # Pastikan file di folder yang sama dengan app.py
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, DATA_FILE)

    # --------------------------
    # A. Load dataset
    # --------------------------
    try:
        df = pd.read_csv(file_path)
    except FileNotFoundError:
        return {"error": f"File data tidak ditemukan. Pastikan '{DATA_FILE}' ada di direktori yang sama."}

    # --------------------------
    # B. Validasi kolom dataset
    # --------------------------
    required_cols = {"bps_nama_kabupaten_kota", "tahun", "bulan", "jumlah_curah_hujan"}
    missing_cols = required_cols - set(df.columns)
    if missing_cols:
        return {"error": f"Dataset tidak sesuai. Kolom hilang: {missing_cols}"}

    # --------------------------
    # C. Filter Kota Bandung
    # --------------------------
    bandung_df = df[
        df["bps_nama_kabupaten_kota"].astype(str).str.contains("KOTA BANDUNG", case=False, na=False)
    ].copy()

    if bandung_df.empty:
        return {"error": "Data Kota Bandung tidak ditemukan di dataset."}

    # Pastikan numerik
    bandung_df["jumlah_curah_hujan"] = pd.to_numeric(
        bandung_df["jumlah_curah_hujan"], errors="coerce"
    )
    bandung_df = bandung_df.dropna(subset=["jumlah_curah_hujan"])

    # --------------------------
    # D. Agregasi total per tahun
    # --------------------------
    yearly_rain = (
        bandung_df.groupby("tahun")["jumlah_curah_hujan"]
        .sum()
        .reset_index()
        .sort_values("tahun")
        .reset_index(drop=True)
    )
    yearly_rain.columns = ["Tahun", "Jumlah Curah Hujan"]
    rain_df = yearly_rain.copy()

    # --------------------------
    # (OPSIONAL) Tangani outlier ekstrem
    # --------------------------
    if HANDLE_OUTLIER:
        p95 = rain_df["Jumlah Curah Hujan"].quantile(0.95)
        rain_df["Jumlah Curah Hujan"] = rain_df["Jumlah Curah Hujan"].clip(upper=p95)

    total_rain = rain_df["Jumlah Curah Hujan"].sum()
    if total_rain <= 0:
        return {"error": "Total curah hujan <= 0. Dataset tidak valid."}

    # --------------------------
    # E. Probabilitas + kumulatif
    # --------------------------
    rain_df["Probabilitas"] = rain_df["Jumlah Curah Hujan"] / total_rain
    rain_df["Kumulatif"] = rain_df["Probabilitas"].cumsum()

    # --------------------------
    # F. Buat interval 000–999 TANPA GAP
    #   - pakai skala 0-999
    #   - batas bawah = batas atas sebelumnya + 1
    # --------------------------
    cumulative_scaled = (rain_df["Kumulatif"] * 1000).round().astype(int)

    rain_df["Batas Atas"] = cumulative_scaled - 1
    rain_df["Batas Bawah"] = rain_df["Batas Atas"].shift(1, fill_value=-1) + 1

    # Rapikan ujung interval
    rain_df.loc[rain_df.index[0], "Batas Bawah"] = 0
    rain_df.loc[rain_df.index[-1], "Batas Atas"] = 999

    # --------------------------
    # G. Format tabel interval untuk HTML
    # --------------------------
    interval_data = rain_df[
        ["Tahun", "Jumlah Curah Hujan", "Probabilitas", "Kumulatif", "Batas Bawah", "Batas Atas"]
    ].copy()

    interval_data["Probabilitas"] = interval_data["Probabilitas"].map("{:.4f}".format)
    interval_data["Kumulatif"] = interval_data["Kumulatif"].map("{:.4f}".format)
    interval_data["Interval"] = interval_data.apply(
        lambda r: f"{r['Batas Bawah']:03d} - {r['Batas Atas']:03d}", axis=1
    )

    # --------------------------
    # H. Mapping angka acak → curah hujan tahunan
    # --------------------------
    def get_prediction(rand_num: int):
        row = rain_df[
            (rain_df["Batas Bawah"] <= rand_num) & (rain_df["Batas Atas"] >= rand_num)
        ]
        return float(row["Jumlah Curah Hujan"].iloc[0]) if not row.empty else np.nan

    # --------------------------
    # I. Simulasi Monte Carlo
    # --------------------------
    random.seed(RANDOM_SEED)
    random_numbers = [random.randint(0, 999) for _ in range(num_simulations)]

    simulation_data = []
    predicted_values = []

    for i, rn in enumerate(random_numbers):
        pred = get_prediction(rn)
        if pd.notna(pred):
            predicted_values.append(pred)

        simulation_data.append({
            "No.": i + 1,
            "Angka Acak": f"{rn:03d}",
            "Prediksi": pred if pd.notna(pred) else 0.0
        })

    # --------------------------
    # J. Prediksi akhir tahunan + rata-rata harian
    # --------------------------
    final_prediction = float(np.mean(predicted_values)) if predicted_values else 0.0
    daily_avg = final_prediction / 365.0

    return {
        "interval_table": interval_data.to_dict("records"),
        "simulation_results": simulation_data,
        "final_prediction": final_prediction,
        "daily_avg_prediction": daily_avg,
        "num_simulations": num_simulations  # ini yang dipakai UI!
    }


# ==========================================================
# 3. ROUTE FLASK
# ==========================================================
@app.route("/", methods=["GET", "POST"])
def index():
    default_sims = 100  # default stabil

    if request.method == "POST":
        try:
            num_sims = int(request.form.get("num_simulations", default_sims))
        except (ValueError, TypeError):
            num_sims = default_sims
    else:
        num_sims = default_sims

    # Guard range
    num_sims = max(1, min(num_sims, 1000))

    results = run_monte_carlo_prediction(num_sims)

    if "error" in results:
        return f"<h1>Error Data:</h1><p>{results['error']}</p>"

    return render_template("index.html", results=results)


if __name__ == "__main__":
    app.run(debug=True)