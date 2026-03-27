import React from 'react';
import { Link } from 'react-router-dom';
import './Terms.scss';

function Terms() {
  return (
    <main className="legal-page">
      <div className="legal-page__container">
        <h1>წესები და პირობები</h1>
        <p>
          ამ ვებსაიტის გამოყენებით, ეთანხმებით, რომ პლატფორმას გამოიყენებთ კანონიერად და ბოროტად
          გამოყენების გარეშე.
        </p>
        <p>
          ანგარიშის მფლობელი პასუხისმგებელია ავტორიზაციის მონაცემების უსაფრთხოებაზე და ანგარიშიდან
          განხორციელებულ აქტივობებზე.
        </p>
        <p>
          ანალიტიკასა და მონაცემთა დამუშავების შესახებ დეტალებისთვის იხილეთ ჩვენი{' '}
          <Link to="/privacy">კონფიდენციალურობის პოლიტიკა</Link>.
        </p>
      </div>
    </main>
  );
}

export default Terms;
