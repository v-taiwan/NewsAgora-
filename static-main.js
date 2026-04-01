const revealItems = [...document.querySelectorAll('.section, .footer-panel, .hero-panel > *, .hero-copy')]

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
      }
    })
  },
  {
    threshold: 0.16,
    rootMargin: '0px 0px -8% 0px'
  }
)

revealItems.forEach((item, index) => {
  item.classList.add('reveal')
  item.style.transitionDelay = `${Math.min(index * 70, 280)}ms`
  observer.observe(item)
})
