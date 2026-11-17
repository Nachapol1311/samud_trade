

        const form = document.getElementById('addUserForm');

        form.addEventListener('submit', (e) => {

            e.preventDefault();

            const password =
                document.getElementById('password').value;

            const confirmPassword =
                document.getElementById('confirmPassword').value;


            // ตรวจสอบว่า Password ตรงกันหรือไม่
            if (password !== confirmPassword) {

                alert('Password does not match');

                return;
            }


            // ตอนนี้ยังไม่มี Backend
            // เมื่อกด Add user จะกลับไปหน้า User Management

            location.href = 'UserManage.html';

        });

    