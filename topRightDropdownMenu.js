    /**
		 *	Top Right Drop Down Menu
		 **/
        const dropdownBtn = document.getElementById('dropdownBtn');
        const dropdownMenu = document.getElementById('dropdownMenu');

		// Reset top right drop down menu on load of this page
		window.addEventListener('pageshow', function (event) {
		  if (event.persisted) {
		    // Force a full reload to reset the HTML and CSS
		    // window.location.reload(); 
	        dropdownMenu.classList.remove('active');
	        dropdownBtn.setAttribute('aria-expanded', 'false');
		  }
		});

        // Toggle the menu visibility on click
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents document click listener from firing instantly
            const isActive = dropdownMenu.classList.toggle('active');
            dropdownBtn.setAttribute('aria-expanded', isActive);
        });

        // Close the menu if the user clicks anywhere else on the screen
        document.addEventListener('click', (e) => {
            if (!dropdownMenu.contains(e.target) && e.target !== dropdownBtn) {
                dropdownMenu.classList.remove('active');
                dropdownBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Close menu with the Escape key (Great for accessibility!)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dropdownMenu.classList.remove('active');
                dropdownBtn.setAttribute('aria-expanded', 'false');
            }
        });