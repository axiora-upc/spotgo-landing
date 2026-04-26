// FAQ accordion
document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const isOpen = btn.getAttribute('aria-expanded') === 'true';

        document.querySelectorAll('.faq-item').forEach((faqItem) => {
            faqItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            faqItem.classList.remove('open');
        });

        if (!isOpen && item) {
            btn.setAttribute('aria-expanded', 'true');
            item.classList.add('open');
        }
    });
});