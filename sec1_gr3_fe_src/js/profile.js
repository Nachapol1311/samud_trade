
        const editBtn = document.getElementById('editBtn');
        const inputs = document.querySelectorAll('#profileForm input');
        let editing = false;

        editBtn.addEventListener('click', () => {
            editing = !editing;
            inputs.forEach(i => i.disabled = !editing);
            editBtn.textContent = editing ? 'Save' : 'Edit';
            if (editing) inputs[0].focus();
        });
    