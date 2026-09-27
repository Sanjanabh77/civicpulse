import './App.css'

function App() {
  return (
    <div className="app">

      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">✦</span>
          Civic<span>Pulse</span>
        </div>

        <div className="nav-links">
          <a href="#how-it-works">How It Works</a>
          <a href="#categories">Categories</a>
          <a href="#about">About</a>
        </div>

        <button className="login-btn">
          Login
        </button>
      </nav>


      <section className="hero-section">

        <div className="hero-content">

          <div className="hero-badge">
            ✦ Community-powered civic action
          </div>

          <h1>
            Make Your City Better,
            <span> One Report at a Time.</span>
          </h1>

          <p>
            Report civic problems, bring your community together,
            and track issues from the first report all the way to resolution.
          </p>

          <div className="hero-buttons">
            <button className="primary-btn">
              Explore Issues →
            </button>

            <button className="secondary-btn">
              Learn More
            </button>
          </div>

          <div className="hero-stats">
            <div>
              <strong>1,250+</strong>
              <small>Issues Reported</small>
            </div>

            <div>
              <strong>820+</strong>
              <small>Issues Resolved</small>
            </div>

            <div>
              <strong>4,500+</strong>
              <small>Community Confirmations</small>
            </div>
          </div>

        </div>


        <div className="hero-visual">

          <div className="city-card">
            <div className="map-grid">

              <div className="road road-one"></div>
              <div className="road road-two"></div>
              <div className="road road-three"></div>

              <div className="map-marker marker-red">!</div>
              <div className="map-marker marker-orange">!</div>
              <div className="map-marker marker-green">✓</div>

              <div className="map-label">
                <strong>12</strong>
                <span>issues nearby</span>
              </div>

            </div>
          </div>

          <div className="floating-card confirmation-card">
            <div className="check-circle">✓</div>

            <div>
              <strong>Issue Confirmed</strong>
              <p>18 citizens confirmed</p>
            </div>
          </div>

          <div className="floating-card resolved-card">
            <div className="resolved-icon">✓</div>

            <div>
              <strong>Issue Resolved</strong>
              <p>Road repaired today</p>
            </div>
          </div>

        </div>

      </section>


      <section className="how-section" id="how-it-works">

        <div className="section-heading">
          <span>HOW CIVICPULSE WORKS</span>

          <h2>From Problem to Solution</h2>

          <p>
            CivicPulse connects citizens and communities
            to make civic problems visible and actionable.
          </p>
        </div>


        <div className="steps-container">

          <div className="step-card">
            <div className="step-icon">📍</div>
            <h3>Report</h3>
            <p>
              Citizens report potholes, garbage,
              broken streetlights and other civic problems.
            </p>
          </div>

          <div className="step-card">
            <div className="step-icon">👥</div>
            <h3>Community Confirms</h3>
            <p>
              Nearby citizens can confirm existing issues
              and reduce duplicate complaints.
            </p>
          </div>

          <div className="step-card">
            <div className="step-icon">⚡</div>
            <h3>Prioritize</h3>
            <p>
              CivicPulse considers severity and confirmations
              to suggest issue priority.
            </p>
          </div>

          <div className="step-card">
            <div className="step-icon">✓</div>
            <h3>Resolve</h3>
            <p>
              Issues can be managed and tracked until
              they are resolved.
            </p>
          </div>

        </div>

      </section>


      <section className="categories-section" id="categories">

        <div className="section-heading">

          <span>CIVIC ISSUES</span>

          <h2>What Can You Report?</h2>

          <p>
            Help make everyday problems visible in your community.
          </p>

        </div>


        <div className="categories-grid">

          <div className="category-card">
            <div className="category-icon">🛣️</div>
            <h3>Potholes</h3>
            <p>Damaged roads and dangerous potholes.</p>
          </div>

          <div className="category-card">
            <div className="category-icon">🗑️</div>
            <h3>Garbage</h3>
            <p>Overflowing garbage and waste problems.</p>
          </div>

          <div className="category-card">
            <div className="category-icon">💡</div>
            <h3>Streetlights</h3>
            <p>Broken or non-functional streetlights.</p>
          </div>

          <div className="category-card">
            <div className="category-icon">💧</div>
            <h3>Water Leakage</h3>
            <p>Water leaks and damaged pipelines.</p>
          </div>

          <div className="category-card">
            <div className="category-icon">🌊</div>
            <h3>Drainage</h3>
            <p>Blocked drains and drainage problems.</p>
          </div>

          <div className="category-card">
            <div className="category-icon">🚶</div>
            <h3>Footpaths</h3>
            <p>Damaged or blocked pedestrian paths.</p>
          </div>

        </div>

      </section>


      <footer id="about">

        <div className="footer-logo">
          ✦ CivicPulse
        </div>

        <p>
          Making civic problems visible. Making communities stronger.
        </p>

        <span>
          © 2026 CivicPulse — Hackathon Prototype
        </span>

      </footer>

    </div>
  )
}

export default App