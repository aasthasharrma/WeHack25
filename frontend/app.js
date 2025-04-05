const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) =>{
        if (entry.isIntersecting){
            entry.target.classList.add('show');
        } else{
            entry.target.classList.remove('show');
        }

    });
});

const hiddenElements = document.querySelectorAll('.hidden');
hiddenElements.forEach((el) => observer.observe(el));

document.addEventListener('DOMContentLoaded', function () {
    var boxes = document.querySelectorAll('.box');

    boxes.forEach(function (box) {
        var checkbox = box.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', function () {
            if (checkbox.checked) {
                // Expand the clicked box
                boxes.forEach(function (otherBox) {
                    if (otherBox !== box && otherBox.classList.contains('expanded')) {
                        otherBox.classList.remove('expanded');
                        // Uncheck the checkbox of the unexpanded box
                        otherBox.querySelector('input[type="checkbox"]').checked = false;
                    }
                });
                box.classList.add('expanded');
            } else {
                // Unexpand the box
                box.classList.remove('expanded');
            }
        });
    });
});
function toggleMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    mobileMenu.classList.toggle('active');
}
