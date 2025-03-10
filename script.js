// متغیرهای گلوبال
let questions = [
    {
        id: 1,
        text: "میزان رضایت کلی شما از عملکرد دپارتمان هوش مصنوعی در سال گذشته چگونه بوده است؟",
        type: "rating",
        options: []
    },
    {
        id: 2,
        text: "کدام یک از پروژه‌های هوش مصنوعی بیشترین تأثیر را بر عملکرد شرکت داشته است؟",
        type: "multiple",
        options: ["پروژه پیش‌بینی فروش", "بات پشتیبانی مشتری", "سیستم تشخیص تصویر", "داشبورد هوشمند"]
    },
    {
        id: 3,
        text: "به نظر شما، مهمترین مهارت‌هایی که تیم هوش مصنوعی باید در سال آینده توسعه دهد، چیست؟",
        type: "text",
        options: []
    }
];

let responses = [];
let responseCounter = 0;
let currentSlide = 0;
let charts = {};
let charts = {};

// پیکربندی Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// مقداردهی Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// آرایه‌ای از کلمات متداول برای شبیه‌سازی پاسخ‌های متنی

// آرایه‌ای از کلمات مهارتی برای شبیه‌سازی پاسخ‌های متنی
const skillWords = [
    "یادگیری عمیق",
    "پردازش زبان طبیعی",
    "هوش مصنوعی تولیدی",
    "بینایی ماشین",
    "یادگیری تقویتی",
    "تحلیل داده",
    "رباتیک",
    "الگوریتم‌های فدرال",
    "هوش مصنوعی توزیع شده",
    "امنیت هوش مصنوعی"
];

// اجرا پس از بارگذاری صفحه
document.addEventListener('DOMContentLoaded', function() {
    // انتخاب تب‌ها
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // فعال کردن تب
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // نمایش محتوای تب
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            
            // اجرای عملیات خاص هر تب
            if (tabId === 'analysis') {
                initCharts();
            } else if (tabId === 'presentation') {
                preparePresentation();
            } else if (tabId === 'survey') {
                generateQRCode();
                updateSurveyPreview();
            } else if (tabId === 'setup') {
                updateQuestionList();
            }
        });
    });
    
    // افزودن event listeners برای کلیدهای مدیریت سوالات
    document.getElementById('add-question').addEventListener('click', addNewQuestion);
    document.getElementById('reset-questions').addEventListener('click', resetQuestions);
    document.getElementById('add-option').addEventListener('click', addOption);
    document.getElementById('question-type').addEventListener('change', toggleOptionsVisibility);
    document.getElementById('copy-link').addEventListener('click', copyLinkToClipboard);
    
    // بارگذاری اولیه
    updateQuestionList();
    updateSurveyLink();
    simulateResponses();
    
    // به روز رسانی نمایش گزینه‌ها بر اساس نوع سوال اولیه
    toggleOptionsVisibility();
});

// تغییر نمایش بخش گزینه‌ها بر اساس نوع سوال
function toggleOptionsVisibility() {
    const questionType = document.getElementById('question-type').value;
    const optionsContainer = document.getElementById('options-container');
    
    if (questionType === 'multiple') {
        optionsContainer.style.display = 'block';
    } else {
        optionsContainer.style.display = 'none';
    }
}

// افزودن گزینه جدید
function addOption() {
    const optionsList = document.getElementById('options-list');
    const newOption = document.createElement('input');
    newOption.type = 'text';
    newOption.className = 'option-input';
    newOption.placeholder = `گزینه ${optionsList.childElementCount + 1}`;
    optionsList.appendChild(newOption);
}

// افزودن سوال جدید
function addNewQuestion() {
    const questionText = document.getElementById('new-question').value;
    const questionType = document.getElementById('question-type').value;
    
    if (!questionText) {
        alert('لطفاً متن سوال را وارد کنید.');
        return;
    }
    
    let options = [];
    if (questionType === 'multiple') {
        document.querySelectorAll('.option-input').forEach(input => {
            if (input.value) {
                options.push(input.value);
            }
        });
        
        if (options.length < 2) {
            alert('حداقل دو گزینه برای سوال چند گزینه‌ای وارد کنید.');
            return;
        }
    }
    
    const newQuestion = {
        id: Date.now(),
        text: questionText,
        type: questionType,
        options: options
    };
    
    questions.push(newQuestion);
    updateQuestionList();
    updateSurveyPreview();
    
    // پاک کردن فرم
    document.getElementById('new-question').value = '';
    document.querySelectorAll('.option-input').forEach(input => {
        input.value = '';
    });
    
    alert('سوال با موفقیت اضافه شد.');
}

// به‌روزرسانی لیست سوالات
function updateQuestionList() {
    const questionList = document.getElementById('question-list');
    questionList.innerHTML = '';
    
    questions.forEach(question => {
        const li = document.createElement('li');
        li.className = 'question-item';
        
        // تعیین برچسب نوع سوال
        let typeLabel = '';
        switch(question.type) {
            case 'multiple':
                typeLabel = 'چندگزینه‌ای';
                break;
            case 'rating':
                typeLabel = 'امتیازدهی';
                break;
            case 'text':
                typeLabel = 'متنی';
                break;
        }
        
        li.innerHTML = `
            <div class="question-text">
                ${question.text}
                <span class="question-type">${typeLabel}</span>
            </div>
            <div class="question-actions">
                <button class="btn-edit" data-id="${question.id}">ویرایش</button>
                <button class="btn-delete btn-danger" data-id="${question.id}">حذف</button>
            </div>
        `;
        questionList.appendChild(li);
    });
    
    // اضافه کردن event listener برای دکمه‌های حذف و ویرایش
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            deleteQuestion(id);
        });
    });
    
    document.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            editQuestion(id);
        });
    });
}

// حذف سوال
function deleteQuestion(id) {
    if (confirm('آیا از حذف این سوال اطمینان دارید؟')) {
        questions = questions.filter(q => q.id !== id);
        updateQuestionList();
        updateSurveyPreview();
    }
}

// ویرایش سوال
function editQuestion(id) {
    const question = questions.find(q => q.id === id);
    if (question) {
        document.getElementById('new-question').value = question.text;
        document.getElementById('question-type').value = question.type;
        
        // نمایش یا مخفی کردن بخش گزینه‌ها
        const optionsContainer = document.getElementById('options-container');
        if (question.type === 'multiple') {
            optionsContainer.style.display = 'block';
            
            // نمایش گزینه‌ها
            const optionsList = document.getElementById('options-list');
            optionsList.innerHTML = '';
            question.options.forEach((option, index) => {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'option-input';
                input.value = option;
                input.placeholder = `گزینه ${index + 1}`;
                optionsList.appendChild(input);
            });
        } else {
            optionsContainer.style.display = 'none';
        }
        
        // حذف سوال قدیمی
        deleteQuestion(id);
        
        // اسکرول به بالای صفحه برای ویرایش
        document.querySelector('.admin-panel').scrollIntoView({ behavior: 'smooth' });
    }
}

// بازنشانی همه سوالات
function resetQuestions() {
    if (confirm('آیا مطمئن هستید که می‌خواهید همه سوالات را بازنشانی کنید؟')) {
        questions = [
            {
                id: 1,
                text: "میزان رضایت کلی شما از عملکرد دپارتمان هوش مصنوعی در سال گذشته چگونه بوده است؟",
                type: "rating",
                options: []
            },
            {
                id: 2,
                text: "کدام یک از پروژه‌های هوش مصنوعی بیشترین تأثیر را بر عملکرد شرکت داشته است؟",
                type: "multiple",
                options: ["پروژه پیش‌بینی فروش", "بات پشتیبانی مشتری", "سیستم تشخیص تصویر", "داشبورد هوشمند"]
            },
            {
                id: 3,
                text: "به نظر شما، مهمترین مهارت‌هایی که تیم هوش مصنوعی باید در سال آینده توسعه دهد، چیست؟",
                type: "text",
                options: []
            }
        ];
        updateQuestionList();
        updateSurveyPreview();
        alert('سوالات به حالت اولیه بازگردانده شدند.');
    }
}

// به‌روزرسانی لینک نظرسنجی
function updateSurveyLink() {
    const currentURL = window.location.href;
    const surveyURL = currentURL.split('?')[0]; // حذف پارامترهای URL
    document.getElementById('survey-link').value = surveyURL;
}

// کپی کردن لینک به کلیپ‌بورد
function copyLinkToClipboard() {
    const linkInput = document.getElementById('survey-link');
    linkInput.select();
    document.execCommand('copy');
    
    // نمایش پیام موفقیت
    const copyButton = document.getElementById('copy-link');
    const originalText = copyButton.textContent;
    copyButton.textContent = 'کپی شد!';
    copyButton.style.backgroundColor = 'var(--success)';
    
    setTimeout(() => {
        copyButton.textContent = originalText;
        copyButton.style.backgroundColor = '';
    }, 2000);
}

// ایجاد کد QR
function generateQRCode() {
    const qrcodeContainer = document.getElementById('qrcode');
    if (qrcodeContainer.innerHTML !== '') return; // اگر قبلاً ایجاد شده، دوباره ایجاد نکن
    
    const surveyURL = document.getElementById('survey-link').value;
    
    // ایجاد QR Code
    new QRCode(qrcodeContainer, {
        text: surveyURL,
        width: 200,
        height: 200,
        colorDark: '#0063a7',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
}

// به‌روزرسانی پیش‌نمایش فرم نظرسنجی
function updateSurveyPreview() {
    const previewContainer = document.getElementById('survey-preview');
    
    if (questions.length === 0) {
        previewContainer.innerHTML = '<p>هیچ سوالی تعریف نشده است.</p>';
        return;
    }
    
    let previewHTML = '<form class="survey-form">';
    
    questions.forEach((question, index) => {
        previewHTML += `<div class="survey-question">
            <p><strong>${index + 1}. ${question.text}</strong></p>`;
        
        if (question.type === 'rating') {
            previewHTML += `<div class="rating-container">`;
            for (let i = 1; i <= 5; i++) {
                previewHTML += `
                    <label class="rating-label">
                        <input type="radio" name="question_${question.id}" value="${i}">
                        <span>${i}</span>
                    </label>
                `;
            }
            previewHTML += `</div>
                <div class="rating-labels">
                    <span>خیلی کم</span>
                    <span>خیلی زیاد</span>
                </div>`;
        } else if (question.type === 'multiple') {
            question.options.forEach(option => {
                previewHTML += `
                    <div class="option-container">
                        <label>
                            <input type="radio" name="question_${question.id}" value="${option}">
                            ${option}
                        </label>
                    </div>
                `;
            });
        } else if (question.type === 'text') {
            previewHTML += `<textarea name="question_${question.id}" rows="3" placeholder="پاسخ خود را اینجا وارد کنید..."></textarea>`;
        }
        
        previewHTML += `</div>`;
    });
    
    previewHTML += `<button type="button" class="survey-submit">ارسال پاسخ</button></form>`;
    
    previewContainer.innerHTML = previewHTML;
    
    // اضافه کردن استایل به پیش‌نمایش
    const style = document.createElement('style');
    style.textContent = `
        .survey-form {
            padding: 20px;
        }
        .survey-question {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
        }
        .rating-container {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin: 10px 0;
        }
        .rating-label {
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
        }
        .rating-label span {
            margin-top: 5px;
            font-size: 14px;
        }
        .rating-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 5px;
            font-size: 12px;
            color: #666;
        }
        .option-container {
            margin: 10px 0;
        }
        textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .survey-submit {
            background-color: var(--primary);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 10px;
            font-size: 16px;
        }
    `;
    previewContainer.appendChild(style);
}

// شبیه‌سازی دریافت پاسخ‌های جدید
function simulateResponses() {
    // در هر 5 ثانیه یک پاسخ جدید شبیه‌سازی می‌شود
    setInterval(() => {
        responseCounter++;
        updateResponseCounter();
        
        // ایجاد یک پاسخ تصادفی
        const newResponse = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            answers: {}
        };
        
        questions.forEach(question => {
            if (question.type === 'rating') {
                newResponse.answers[question.id] = Math.floor(Math.random() * 5) + 1;
            } else if (question.type === 'multiple') {
                if (question.options.length > 0) {
                    const randomIndex = Math.floor(Math.random() * question.options.length);
                    newResponse.answers[question.id] = question.options[randomIndex];
                }
            } else if (question.type === 'text') {
                // انتخاب یکی یا دو مهارت تصادفی
                const randomCount = Math.floor(Math.random() * 2) + 1;
                let skills = [];
                
                for (let i = 0; i < randomCount; i++) {
                    const randomIndex = Math.floor(Math.random() * skillWords.length);
                    skills.push(skillWords[randomIndex]);
                }
                
                newResponse.answers[question.id] = skills.join(', ');
            }
        });
        
        responses.push(newResponse);
        
        // به‌روزرسانی تحلیل‌ها اگر تب تحلیل فعال است
        if (document.getElementById('analysis').classList.contains('active')) {
            updateCharts();
            updateAIAnalysis();
        }
        
        // به‌روزرسانی ارائه اگر تب ارائه فعال است
        if (document.getElementById('presentation').classList.contains('active')) {
            updatePresentationCharts();
        }
    }, 5000);
}

// به‌روزرسانی شمارنده پاسخ‌ها
function updateResponseCounter() {
    document.getElementById('response-counter').textContent = responseCounter;
}

// راه‌اندازی نمودارها
function initCharts() {
    if (charts.responsesChart || charts.sentimentChart) return; // اگر قبلاً راه‌اندازی شده‌اند، دوباره راه‌اندازی نکن
    
    const ctx1 = document.getElementById('responses-chart').getContext('2d');
    const ctx2 = document.getElementById('sentiment-chart').getContext('2d');
    
    // نمودار پاسخ‌ها برای سوال اول (رضایت کلی)
    charts.responsesChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['1 (خیلی کم)', '2 (کم)', '3 (متوسط)', '4 (زیاد)', '5 (خیلی زیاد)'],
            datasets: [{
                label: 'میزان رضایت کلی',
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(255, 159, 64, 0.5)',
                    'rgba(255, 205, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(54, 162, 235, 0.5)'
                ],
                borderColor: [
                    'rgb(255, 99, 132)',
                    'rgb(255, 159, 64)',
                    'rgb(255, 205, 86)',
                    'rgb(75, 192, 192)',
                    'rgb(54, 162, 235)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'میزان رضایت کلی از عملکرد دپارتمان هوش مصنوعی'
                }
            }
        }
    });
    
    // نمودار احساسات بر اساس پاسخ‌های متنی
    charts.sentimentChart = new Chart(ctx2, {
        type: 'pie',
        data: {
            labels: ['مثبت', 'خنثی', 'منفی'],
            datasets: [{
                label: 'تحلیل احساسات',
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(201, 203, 207, 0.5)',
                    'rgba(255, 99, 132, 0.5)'
                ],
                borderColor: [
                    'rgb(75, 192, 192)',
                    'rgb(201, 203, 207)',
                    'rgb(255, 99, 132)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'تحلیل احساسات پاسخ‌های متنی'
                }
            }
        }
    });
    
    // راه‌اندازی ویژوالیزیشن سه‌بعدی
    init3DVisualization();
    
    // به‌روزرسانی نمودارها با داده‌های فعلی
    updateCharts();
    
    // تحلیل هوش مصنوعی
    updateAIAnalysis();
}

// به‌روزرسانی نمودارها
function updateCharts() {
    if (!charts.responsesChart || !charts.sentimentChart) return;
    
    // محاسبه داده‌های نمودار رضایت
    const ratingCounts = [0, 0, 0, 0, 0];
    responses.forEach(response => {
        const rating = response.answers[1]; // سوال شماره 1 (رضایت کلی)
        if (rating >= 1 && rating <= 5) {
            ratingCounts[rating - 1]++;
        }
    });
    
    charts.responsesChart.data.datasets[0].data = ratingCounts;
    charts.responsesChart.update();
    
    // شبیه‌سازی تحلیل احساسات
    const sentimentCounts = [0, 0, 0]; // مثبت، خنثی، منفی
    responses.forEach(response => {
        // این تنها یک شبیه‌سازی است - در نسخه واقعی از هوش مصنوعی برای تحلیل استفاده می‌شود
        const random = Math.random();
        if (random < 0.6) {
            sentimentCounts[0]++; // مثبت
        } else if (random < 0.8) {
            sentimentCounts[1]++; // خنثی
        } else {
            sentimentCounts[2]++; // منفی
        }
    });
    
    charts.sentimentChart.data.datasets[0].data = sentimentCounts;
    charts.sentimentChart.update();
}

// به‌روزرسانی تحلیل هوش مصنوعی
function updateAIAnalysis() {
    // شبیه‌سازی تحلیل هوش مصنوعی
    const aiAnalysisDiv = document.getElementById('ai-analysis');
    
    if (responses.length === 0) {
        aiAnalysisDiv.innerHTML = '<p>هنوز پاسخی دریافت نشده است.</p>';
        return;
    }
    
    // محاسبه میانگین رضایت
    let totalRating = 0;
    let ratingCount = 0;
    responses.forEach(response => {
        const rating = response.answers[1];
        if (rating >= 1 && rating <= 5) {
            totalRating += rating;
            ratingCount++;
        }
    });
    
    const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;
    
    // شمارش پاسخ‌های سوال دوم (پروژه‌ها)
    const projectCounts = {};
    responses.forEach(response => {
        const project = response.answers[2];
        if (project) {
            projectCounts[project] = (projectCounts[project] || 0) + 1;
        }
    });
    
    // یافتن محبوب‌ترین پروژه
    let topProject = '';
    let topCount = 0;
    for (const project in projectCounts) {
        if (projectCounts[project] > topCount) {
            topCount = projectCounts[project];
            topProject = project;
        }
    }
    
    // تحلیل پاسخ‌های متنی (سوال سوم)
    const textResponses = responses.map(r => r.answers[3]).filter(Boolean);
    
    // شمارش کلمات کلیدی در پاسخ‌های متنی
    const keywordCounts = {};
    skillWords.forEach(skill => {
        keywordCounts[skill] = 0;
    });
    
    textResponses.forEach(response => {
        skillWords.forEach(skill => {
            if (response.includes(skill)) {
                keywordCounts[skill]++;
            }
        });
    });
    
    // یافتن مهارت‌های پرتکرار
    const topSkills = Object.entries(keywordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);
    
    // ایجاد خروجی تحلیل
    aiAnalysisDiv.innerHTML = `
        <div class="analysis-summary">
            <p><strong>میانگین رضایت کلی:</strong> ${avgRating} از 5</p>
            <p><strong>محبوب‌ترین پروژه:</strong> ${topProject || 'داده کافی نیست'}</p>
            <p><strong>مهارت‌های پیشنهادی برای توسعه:</strong></p>
            <ul>
                ${topSkills.map(skill => `<li>${skill}</li>`).join('')}
            </ul>
            
            <p><strong>تحلیل روند:</strong> ${responses.length < 5 ? 'نیاز به داده‌های بیشتر' : 'روند رضایت رو به افزایش است'}</p>
            
            <p><strong>پیشنهادات هوش مصنوعی:</strong></p>
            <ul>
                <li>تمرکز بیشتر روی پروژه ${topProject || 'های محبوب'}</li>
                <li>سرمایه‌گذاری روی آموزش در زمینه ${topSkills[0] || 'مهارت‌های جدید'}</li>
                <li>برگزاری کارگاه‌های آموزشی در حوزه ${topSkills[1] || 'هوش مصنوعی'}</li>
                <li>استفاده از ابزارهای پیشرفته‌تر برای توسعه ${topSkills[2] || 'محصولات هوش مصنوعی'}</li>
            </ul>
            
            <p><strong>خلاصه عملکرد:</strong> براساس داده‌های فعلی، عملکرد تیم هوش مصنوعی ${avgRating > 3.5 ? 'رضایت‌بخش' : 'نیازمند بهبود'} ارزیابی می‌شود.</p>
        </div>
    `;
}

// راه‌اندازی ویژوالیزیشن سه‌بعدی
function init3DVisualization() {
    const container = document.getElementById('visualization-3d');
    if (!container) return;
    
    // راه‌اندازی Three.js
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    
    // تنظیم رنگ پس‌زمینه
    renderer.setClearColor(0x111111);
    
    // افزودن نور
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 1, 1).normalize();
    scene.add(directionalLight);
    
    // ایجاد پایه
    const geometry = new THREE.BoxGeometry(6, 0.2, 6);
    const material = new THREE.MeshPhongMaterial({color: 0x404040});
    const base = new THREE.Mesh(geometry, material);
    base.position.y = -2;
    scene.add(base);
    
    // ایجاد ستون‌های نمودار
    const columns = [];
    const columnColors = [0xff6384, 0x36a2eb, 0xffce56, 0x4bc0c0, 0x9966ff];
    
    for (let i = 0; i < 5; i++) {
        const columnGeometry = new THREE.BoxGeometry(0.8, 1, 0.8);
        const columnMaterial = new THREE.MeshPhongMaterial({color: columnColors[i]});
        const column = new THREE.Mesh(columnGeometry, columnMaterial);
        column.position.set(i * 1.5 - 3, -1.5, 0);
        scene.add(column);
        columns.push(column);
    }
    
    // ایجاد برچسب‌های نمودار
    const labels = ["خیلی کم", "کم", "متوسط", "زیاد", "خیلی زیاد"];
    
    // تنظیم دوربین
    camera.position.z = 8;
    camera.position.y = 2;
    
    // انیمیشن
    function animate() {
        requestAnimationFrame(animate);
        
        // چرخش آرام دوربین
        camera.position.x = Math.sin(Date.now() * 0.001) * 8;
        camera.position.z = Math.cos(Date.now() * 0.001) * 8;
        camera.lookAt(0, 0, 0);
        
        // به‌روزرسانی ارتفاع ستون‌ها بر اساس داده‌ها
        if (charts.responsesChart) {
            const data = charts.responsesChart.data.datasets[0].data;
            const maxValue = Math.max(...data, 1);
            
            for (let i = 0; i < 5; i++) {
                const targetHeight = (data[i] / maxValue) * 4 + 0.1;
                // انیمیشن تغییر ارتفاع
                columns[i].scale.y += (targetHeight - columns[i].scale.y) * 0.05;
                columns[i].position.y = -1.5 + columns[i].scale.y / 2;
            }
        }
        
        renderer.render(scene, camera);
    }
    
    animate();
    
    // تنظیم مجدد اندازه در صورت تغییر اندازه پنجره
    window.addEventListener('resize', () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });
}

// آماده‌سازی اسلایدهای ارائه
function preparePresentation() {
    const container = document.getElementById('presentation-container');
    container.innerHTML = `
        <div class="presentation-slide" data-slide="1">
            <h2>نتایج نظرسنجی پایان سال</h2>
            <h3>دپارتمان هوش مصنوعی - نوآوران درمان اطلس</h3>
            <div class="chart-container">
                <canvas id="presentation-chart-1"></canvas>
            </div>
        </div>
        
        <div class="presentation-slide" data-slide="2" style="display: none;">
            <h2>پروژه‌های تأثیرگذار</h2>
            <div class="chart-container">
                <canvas id="presentation-chart-2"></canvas>
            </div>
        </div>
        
        <div class="presentation-slide" data-slide="3" style="display: none;">
            <h2>مهارت‌های پیشنهادی برای توسعه</h2>
            <div class="chart-container">
                <canvas id="presentation-chart-3"></canvas>
            </div>
        </div>
        
        <div class="presentation-slide" data-slide="4" style="display: none;">
            <h2>نتیجه‌گیری و پیشنهادات</h2>
            <div id="presentation-conclusion">
                <p>در حال تحلیل داده‌ها...</p>
            </div>
        </div>
    `;
    
    // راه‌اندازی نمودارهای ارائه
    initPresentationCharts();
    
    // اضافه کردن event listener برای دکمه‌های ارائه
    document.getElementById('start-presentation').addEventListener('click', startPresentation);
    document.getElementById('next-slide').addEventListener('click', nextSlide);
    document.getElementById('prev-slide').addEventListener('click', prevSlide);
    
    // نمایش اسلاید اول
    showSlide(0);
}

// راه‌اندازی نمودارهای ارائه
function initPresentationCharts() {
    const ctx1 = document.getElementById('presentation-chart-1');
    const ctx2 = document.getElementById('presentation-chart-2');
    const ctx3 = document.getElementById('presentation-chart-3');
    
    if (!ctx1 || !ctx2 || !ctx3) return;
    
    // نمودار رضایت کلی
    charts.presentationChart1 = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['1 (خیلی کم)', '2 (کم)', '3 (متوسط)', '4 (زیاد)', '5 (خیلی زیاد)'],
            datasets: [{
                label: 'میزان رضایت کلی',
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(255, 205, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(54, 162, 235, 0.7)'
                ],
                borderColor: [
                    'rgb(255, 99, 132)',
                    'rgb(255, 159, 64)',
                    'rgb(255, 205, 86)',
                    'rgb(75, 192, 192)',
                    'rgb(54, 162, 235)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'میزان رضایت کلی از عملکرد دپارتمان هوش مصنوعی',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: false
                }
            }
        }
    });
    
    // نمودار پروژه‌های تأثیرگذار
    charts.presentationChart2 = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['پروژه پیش‌بینی فروش', 'بات پشتیبانی مشتری', 'سیستم تشخیص تصویر', 'داشبورد هوشمند'],
            datasets: [{
                label: 'پروژه‌های تأثیرگذار',
                data: [0, 0, 0, 0],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 205, 86, 0.7)',
                    'rgba(255, 99, 132, 0.7)'
                ],
                borderColor: [
                    'rgb(54, 162, 235)',
                    'rgb(75, 192, 192)',
                    'rgb(255, 205, 86)',
                    'rgb(255, 99, 132)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'پروژه‌های تأثیرگذار',
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
    
    // نمودار مهارت‌های پیشنهادی
    charts.presentationChart3 = new Chart(ctx3, {
        type: 'radar',
        data: {
            labels: ['یادگیری عمیق', 'پردازش زبان طبیعی', 'هوش مصنوعی تولیدی', 'بینایی ماشین', 'یادگیری تقویتی'],
            datasets: [{
                label: 'فراوانی پیشنهادات',
                data: [0, 0, 0, 0, 0],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgb(54, 162, 235)',
                pointBackgroundColor: 'rgb(54, 162, 235)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(54, 162, 235)'
            }]
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    ticks: {
                        backdropColor: 'rgba(255, 255, 255, 0.7)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'مهارت‌های پیشنهادی برای توسعه',
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
    
    // به‌روزرسانی نمودارها
    updatePresentationCharts();
}

// به‌روزرسانی نمودارهای ارائه
function updatePresentationCharts() {
    if (!charts.presentationChart1 || !charts.presentationChart2 || !charts.presentationChart3) return;
    
    // نمودار 1: رضایت کلی
    const ratingCounts = [0, 0, 0, 0, 0];
    responses.forEach(response => {
        const rating = response.answers[1];
        if (rating >= 1 && rating <= 5) {
            ratingCounts[rating - 1]++;
        }
    });
    
    charts.presentationChart1.data.datasets[0].data = ratingCounts;
    charts.presentationChart1.update();
    
    // نمودار 2: پروژه‌های تأثیرگذار
    const projectCounts = [0, 0, 0, 0]; // به ترتیب لیبل‌ها
    responses.forEach(response => {
        const project = response.answers[2];
        if (project === 'پروژه پیش‌بینی فروش') projectCounts[0]++;
        else if (project === 'بات پشتیبانی مشتری') projectCounts[1]++;
        else if (project === 'سیستم تشخیص تصویر') projectCounts[2]++;
        else if (project === 'داشبورد هوشمند') projectCounts[3]++;
    });
    
    charts.presentationChart2.data.datasets[0].data = projectCounts;
    charts.presentationChart2.update();
    
    // نمودار 3: مهارت‌های پیشنهادی
    const skillCounts = [0, 0, 0, 0, 0]; // به ترتیب لیبل‌ها
    
    responses.forEach(response => {
        const skill = response.answers[3];
        if (!skill) return;
        
        if (skill.includes('یادگیری عمیق')) skillCounts[0]++;
        if (skill.includes('پردازش زبان طبیعی')) skillCounts[1]++;
        if (skill.includes('هوش مصنوعی تولیدی')) skillCounts[2]++;
        if (skill.includes('بینایی ماشین')) skillCounts[3]++;
        if (skill.includes('یادگیری تقویتی')) skillCounts[4]++;
    });
    
    charts.presentationChart3.data.datasets[0].data = skillCounts;
    charts.presentationChart3.update();
    
    // به‌روزرسانی نتیجه‌گیری
    updatePresentationConclusion();
}

// به‌روزرسانی نتیجه‌گیری ارائه
function updatePresentationConclusion() {
    const conclusionDiv = document.getElementById('presentation-conclusion');
    if (!conclusionDiv) return;
    
    if (responses.length === 0) {
        conclusionDiv.innerHTML = '<p>داده‌ای برای تحلیل وجود ندارد.</p>';
        return;
    }
    
    // محاسبه میانگین رضایت
    let totalRating = 0;
    let ratingCount = 0;
    responses.forEach(response => {
        const rating = response.answers[1];
        if (rating >= 1 && rating <= 5) {
            totalRating += rating;
            ratingCount++;
        }
    });
    
    const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;
    
    // یافتن محبوب‌ترین پروژه
    const projectCounts = {};
    responses.forEach(response => {
        const project = response.answers[2];
        if (project) {
            projectCounts[project] = (projectCounts[project] || 0) + 1;
        }
    });
    
    let topProject = '';
    let topCount = 0;
    for (const project in projectCounts) {
        if (projectCounts[project] > topCount) {
            topCount = projectCounts[project];
            topProject = project;
        }
    }
    
    // یافتن مهارت‌های پیشنهادی پرتکرار
    const skillCounts = {};
    responses.forEach(response => {
        const skill = response.answers[3];
        if (!skill) return;
        
        skillWords.forEach(keyword => {
            if (skill.includes(keyword)) {
                skillCounts[keyword] = (skillCounts[keyword] || 0) + 1;
            }
        });
    });
    
    const topSkills = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);
    
    // ایجاد خروجی نتیجه‌گیری
    conclusionDiv.innerHTML = `
        <div class="conclusion-content">
            <p><strong>میانگین رضایت کلی:</strong> ${avgRating} از 5</p>
            <p><strong>محبوب‌ترین پروژه:</strong> ${topProject || 'داده کافی نیست'}</p>
            <p><strong>مهارت‌های پیشنهادی پرتکرار:</strong></p>
            <ul>
                ${topSkills.map(skill => `<li>${skill}</li>`).join('') || '<li>داده کافی نیست</li>'}
            </ul>
            
            <h3>پیشنهادات برای سال آینده:</h3>
            <ul>
                <li>تمرکز بیشتر روی توسعه ${topProject || 'پروژه‌های محبوب'}</li>
                <li>برگزاری دوره‌های آموزشی در زمینه ${topSkills[0] || 'مهارت‌های جدید'}</li>
                <li>ارتقای فرآیندهای همکاری بین تیمی</li>
                <li>استفاده از روش‌های جدید ارزیابی عملکرد</li>
                <li>سرمایه‌گذاری در زمینه ${topSkills[1] || 'فناوری‌های نوین هوش مصنوعی'}</li>
            </ul>
        </div>
    `;
}

// شروع حالت ارائه
function startPresentation() {
    currentSlide = 0;
    showSlide(currentSlide);
}

// نمایش اسلاید با شماره مشخص
function showSlide(index) {
    const slides = document.querySelectorAll('.presentation-slide');
    if (index < 0 || index >= slides.length) return;
    
    slides.forEach((slide, i) => {
        slide.style.display = i === index ? 'block' : 'none';
    });
    
    currentSlide = index;
}

// اسلاید بعدی
function nextSlide() {
    const slides = document.querySelectorAll('.presentation-slide');
    if (currentSlide < slides.length - 1) {
        showSlide(currentSlide + 1);
    }
}

// اسلاید قبلی
function prevSlide() {
    if (currentSlide > 0) {
        showSlide(currentSlide - 1);
    }
}

