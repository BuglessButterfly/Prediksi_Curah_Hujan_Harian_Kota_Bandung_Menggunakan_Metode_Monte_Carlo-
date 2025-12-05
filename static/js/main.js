// Modern JavaScript untuk Website Simulasi Monte Carlo

document.addEventListener('DOMContentLoaded', function() {
    // Animasi saat halaman dimuat
    initPageAnimations();
    
    // Interaktivitas form
    initFormInteractions();
    
    // Animasi tabel
    initTableAnimations();
    
    // Smooth scroll untuk elemen
    initSmoothScroll();
    
    // Validasi form
    initFormValidation();
});

// Fungsi untuk animasi saat halaman dimuat
function initPageAnimations() {
    const container = document.querySelector('.container');
    if (container) {
        container.style.opacity = '0';
        container.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            container.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }, 100);
    }
    
    // Animasi untuk tabel
    const tables = document.querySelectorAll('table');
    tables.forEach((table, index) => {
        table.style.opacity = '0';
        table.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            table.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            table.style.opacity = '1';
            table.style.transform = 'translateY(0)';
        }, 300 + (index * 200));
    });
    
    // Animasi untuk prediction result
    const predictionResult = document.querySelector('.prediction-result');
    if (predictionResult) {
        predictionResult.style.opacity = '0';
        predictionResult.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            predictionResult.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            predictionResult.style.opacity = '1';
            predictionResult.style.transform = 'scale(1)';
        }, 800);
    }
}

// Fungsi untuk interaktivitas form
function initFormInteractions() {
    const form = document.querySelector('.form-simulasi form');
    const input = document.querySelector('#num_simulations');
    const button = document.querySelector('.form-simulasi button');
    
    if (input) {
        // Efek saat input fokus
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
            this.parentElement.style.transition = 'transform 0.3s ease';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
        
        // Validasi real-time
        input.addEventListener('input', function() {
            const value = parseInt(this.value);
            if (value < 1) {
                this.style.borderColor = '#dc3545';
                this.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.1)';
            } else if (value > 1000) {
                this.style.borderColor = '#ffc107';
                this.style.boxShadow = '0 0 0 3px rgba(255, 193, 7, 0.1)';
            } else {
                this.style.borderColor = '#28a745';
                this.style.boxShadow = '0 0 0 3px rgba(40, 167, 69, 0.1)';
            }
        });
    }
    
    if (button && form) {
        // Loading state saat submit
        form.addEventListener('submit', function() {
            const originalText = button.innerHTML;
            button.innerHTML = '<span class="loading"></span> Memproses...';
            button.disabled = true;
            button.style.opacity = '0.7';
            button.style.cursor = 'not-allowed';
            
            // Jika form tidak submit (misalnya karena validasi), kembalikan button
            setTimeout(() => {
                if (!form.checkValidity()) {
                    button.innerHTML = originalText;
                    button.disabled = false;
                    button.style.opacity = '1';
                    button.style.cursor = 'pointer';
                }
            }, 100);
        });
    }
}

// Fungsi untuk animasi tabel
function initTableAnimations() {
    const tableRows = document.querySelectorAll('table tbody tr');
    
    // Intersection Observer untuk animasi saat scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateX(0)';
                }, index * 50);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    tableRows.forEach(row => {
        row.style.opacity = '0';
        row.style.transform = 'translateX(-20px)';
        row.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        observer.observe(row);
    });
    
    // Efek hover yang lebih smooth
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s ease';
        });
    });
}

// Fungsi untuk smooth scroll
function initSmoothScroll() {
    // Smooth scroll untuk anchor links (jika ada)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Fungsi untuk validasi form
function initFormValidation() {
    const input = document.querySelector('#num_simulations');
    const form = document.querySelector('.form-simulasi form');
    
    if (input && form) {
        form.addEventListener('submit', function(e) {
            const value = parseInt(input.value);
            
            if (isNaN(value) || value < 1) {
                e.preventDefault();
                showNotification('Jumlah simulasi harus minimal 1', 'error');
                input.focus();
                return false;
            }
            
            if (value > 1000) {
                e.preventDefault();
                showNotification('Jumlah simulasi maksimal 1000 untuk performa optimal', 'warning');
                input.focus();
                return false;
            }
        });
    }
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message, type = 'info') {
    // Hapus notifikasi sebelumnya jika ada
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Buat elemen notifikasi
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Styling notifikasi
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-weight: 500;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Hapus notifikasi setelah 3 detik
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Tambahkan animasi CSS untuk notifikasi
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Fungsi untuk menambahkan efek parallax ringan pada header
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (header) {
        const scrolled = window.pageYOffset;
        header.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Fungsi untuk menampilkan tooltip pada input
const input = document.querySelector('#num_simulations');
if (input) {
    input.addEventListener('mouseenter', function() {
        if (!this.title) {
            this.title = 'Masukkan jumlah simulasi antara 1-1000';
        }
    });
}

// Format angka dengan pemisah ribuan
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Fungsi animasi counter untuk angka prediksi
function animateCounter(element, start, end, duration, suffix = '') {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        element.textContent = formatNumber(current) + suffix;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Jalankan animasi counter jika ada elemen prediksi
const predictionStrong = document.querySelector('.prediction-result strong');
if (predictionStrong) {
    const dataValue = predictionStrong.getAttribute('data-value');
    if (dataValue) {
        const number = parseInt(dataValue);
        if (!isNaN(number) && number > 0) {
            const originalText = predictionStrong.textContent.replace(/\d[\d,]*/g, ''); // Simpan teks selain angka
            predictionStrong.textContent = '0' + originalText;
            setTimeout(() => {
                animateCounter(predictionStrong, 0, number, 2000, originalText);
            }, 1000);
        }
    }
}

