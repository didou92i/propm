// Service de génération HTML5 dynamique pour PrepaCDS

interface HTMLGeneratorOptions {
  theme?: 'light' | 'dark';
  animations?: boolean;
  accessibility?: boolean;
}

interface QuizConfig {
  questions: any[];
  theme: string;
  animations: boolean;
}

export class HTMLGenerator {
  private theme: string;
  private animations: boolean;
  private accessibility: boolean;

  constructor(options: HTMLGeneratorOptions = {}) {
    this.theme = options.theme || 'light';
    this.animations = options.animations !== false;
    this.accessibility = options.accessibility !== false;
  }

  // Génère le HTML pour un quiz interactif
  generateQuizHTML(config: QuizConfig): string {
    const { questions, theme } = config;
    
    return `
<!DOCTYPE html>
<html lang="fr" class="${theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quiz PrepaCDS Interactif</title>
  <style>
    ${this.generateQuizCSS()}
  </style>
</head>
<body>
  <div class="quiz-container">
    <header class="quiz-header">
      <h1>Quiz PrepaCDS</h1>
      <div class="progress-bar">
        <div class="progress-fill" style="width: 0%"></div>
      </div>
    </header>
    
    <main class="quiz-content">
      ${questions.map((q, index) => this.generateQuestionHTML(q, index)).join('')}
    </main>
    
    <footer class="quiz-footer">
      <div class="quiz-controls">
        <button id="prev-btn" class="control-btn" disabled>Précédent</button>
        <button id="next-btn" class="control-btn">Suivant</button>
      </div>
    </footer>
  </div>
  
  <script>
    ${this.generateQuizJS()}
  </script>
</body>
</html>`;
  }

  // Génère le CSS pour le quiz
  private generateQuizCSS(): string {
    return `
      :root {
        --primary-color: hsl(39, 96%, 56%);
        --secondary-color: hsl(39, 96%, 43%);
        --success-color: hsl(142, 76%, 36%);
        --error-color: hsl(0, 84%, 60%);
        --background: hsl(0, 0%, 100%);
        --foreground: hsl(222.2, 84%, 4.9%);
        --border: hsl(214.3, 31.8%, 91.4%);
      }

      [class="dark"] {
        --background: hsl(222.2, 84%, 4.9%);
        --foreground: hsl(210, 40%, 98%);
        --border: hsl(217.2, 32.6%, 17.5%);
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: var(--background);
        color: var(--foreground);
        line-height: 1.6;
      }

      .quiz-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }

      .quiz-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .quiz-header h1 {
        color: var(--primary-color);
        font-size: 2rem;
        margin-bottom: 1rem;
      }

      .progress-bar {
        width: 100%;
        height: 8px;
        background: var(--border);
        border-radius: 4px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
        transition: width 0.3s ease;
      }

      .question-card {
        background: var(--background);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 2rem;
        margin-bottom: 1rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        display: none;
        ${this.animations ? 'animation: slideIn 0.5s ease-out;' : ''}
      }

      .question-card.active {
        display: block;
      }

      .question-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
        color: var(--foreground);
      }

      .options-grid {
        display: grid;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .option-button {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 1rem;
        background: var(--background);
        border: 2px solid var(--border);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;
        font-size: 0.95rem;
      }

      .option-button:hover {
        border-color: var(--primary-color);
        transform: translateY(-2px);
      }

      .option-button.selected {
        border-color: var(--primary-color);
        background: var(--primary-color);
        color: white;
      }

      .option-button.correct {
        border-color: var(--success-color);
        background: var(--success-color);
        color: white;
      }

      .option-button.incorrect {
        border-color: var(--error-color);
        background: var(--error-color);
        color: white;
        ${this.animations ? 'animation: shake 0.4s ease-in-out;' : ''}
      }

      .option-letter {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: currentColor;
        color: var(--background);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.9rem;
      }

      .explanation {
        background: var(--border);
        padding: 1rem;
        border-radius: 8px;
        margin-top: 1rem;
        display: none;
        ${this.animations ? 'animation: fadeIn 0.3s ease-out;' : ''}
      }

      .explanation.show {
        display: block;
      }

      .explanation-title {
        font-weight: 600;
        color: var(--primary-color);
        margin-bottom: 0.5rem;
      }

      .quiz-controls {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        margin-top: auto;
        padding-top: 2rem;
      }

      .control-btn {
        padding: 0.75rem 1.5rem;
        border: 2px solid var(--primary-color);
        background: transparent;
        color: var(--primary-color);
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s ease;
      }

      .control-btn:hover:not(:disabled) {
        background: var(--primary-color);
        color: white;
      }

      .control-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      ${this.animations ? this.generateAnimationCSS() : ''}
      ${this.accessibility ? this.generateAccessibilityCSS() : ''}
    `;
  }

  // Génère les animations CSS
  private generateAnimationCSS(): string {
    return `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(30px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `;
  }

  // Génère les styles d'accessibilité
  private generateAccessibilityCSS(): string {
    return `
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }

      .option-button:focus {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `;
  }

  // Génère le HTML pour une question
  private generateQuestionHTML(question: any, index: number): string {
    return `
      <div class="question-card ${index === 0 ? 'active' : ''}" data-question="${index}">
        <h2 class="question-title">${question.question}</h2>
        <div class="options-grid">
          ${question.options.map((option: string, optIndex: number) => `
            <button class="option-button" data-option="${optIndex}" ${this.accessibility ? `aria-label="Option ${String.fromCharCode(65 + optIndex)}: ${option}"` : ''}>
              <div class="option-letter">${String.fromCharCode(65 + optIndex)}</div>
              <span>${option}</span>
            </button>
          `).join('')}
        </div>
        <div class="explanation">
          <div class="explanation-title">Explication :</div>
          <div>${question.explanation}</div>
        </div>
      </div>
    `;
  }

  // Génère le JavaScript pour le quiz
  private generateQuizJS(): string {
    return `
      class QuizManager {
        constructor() {
          this.currentQuestion = 0;
          this.totalQuestions = document.querySelectorAll('.question-card').length;
          this.answers = [];
          this.score = 0;
          this.init();
        }

        init() {
          this.updateProgress();
          this.bindEvents();
        }

        bindEvents() {
          // Gestion des options
          document.querySelectorAll('.option-button').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectOption(e));
          });

          // Gestion des contrôles
          document.getElementById('prev-btn').addEventListener('click', () => this.previousQuestion());
          document.getElementById('next-btn').addEventListener('click', () => this.nextQuestion());

          // Support clavier
          document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        }

        selectOption(e) {
          const button = e.currentTarget;
          const questionCard = button.closest('.question-card');
          const questionIndex = parseInt(questionCard.dataset.question);
          const optionIndex = parseInt(button.dataset.option);

          // Désélectionner les autres options
          questionCard.querySelectorAll('.option-button').forEach(btn => {
            btn.classList.remove('selected');
          });

          // Sélectionner cette option
          button.classList.add('selected');
          this.answers[questionIndex] = optionIndex;

          // Afficher le résultat après un délai
          setTimeout(() => this.showResult(questionCard, optionIndex), 500);
        }

        showResult(questionCard, selectedOption) {
          const questionData = this.getQuestionData(questionCard);
          const isCorrect = selectedOption === questionData.correctAnswer;
          
          questionCard.querySelectorAll('.option-button').forEach((btn, index) => {
            btn.disabled = true;
            if (index === questionData.correctAnswer) {
              btn.classList.add('correct');
            } else if (index === selectedOption && !isCorrect) {
              btn.classList.add('incorrect');
            }
          });

          // Afficher l'explication
          const explanation = questionCard.querySelector('.explanation');
          explanation.classList.add('show');

          if (isCorrect) {
            this.score++;
          }

          // Activer le bouton suivant
          document.getElementById('next-btn').disabled = false;
        }

        nextQuestion() {
          if (this.currentQuestion < this.totalQuestions - 1) {
            document.querySelector('.question-card.active').classList.remove('active');
            this.currentQuestion++;
            document.querySelector(\`[data-question="\${this.currentQuestion}"]\`).classList.add('active');
            this.updateProgress();
            this.updateControls();
          } else {
            this.finishQuiz();
          }
        }

        previousQuestion() {
          if (this.currentQuestion > 0) {
            document.querySelector('.question-card.active').classList.remove('active');
            this.currentQuestion--;
            document.querySelector(\`[data-question="\${this.currentQuestion}"]\`).classList.add('active');
            this.updateProgress();
            this.updateControls();
          }
        }

        updateProgress() {
          const progress = ((this.currentQuestion + 1) / this.totalQuestions) * 100;
          document.querySelector('.progress-fill').style.width = \`\${progress}%\`;
        }

        updateControls() {
          const prevBtn = document.getElementById('prev-btn');
          const nextBtn = document.getElementById('next-btn');
          
          prevBtn.disabled = this.currentQuestion === 0;
          nextBtn.disabled = !this.answers[this.currentQuestion];
          
          if (this.currentQuestion === this.totalQuestions - 1) {
            nextBtn.textContent = 'Terminer';
          } else {
            nextBtn.textContent = 'Suivant';
          }
        }

        handleKeyboard(e) {
          if (e.key >= '1' && e.key <= '4') {
            const optionIndex = parseInt(e.key) - 1;
            const currentCard = document.querySelector('.question-card.active');
            const option = currentCard.querySelector(\`[data-option="\${optionIndex}"]\`);
            if (option) option.click();
          }
        }

        getQuestionData(questionCard) {
          // Cette fonction devrait récupérer les données de la question
          // Pour la démo, on utilise des données statiques
          return { correctAnswer: 0 };
        }

        finishQuiz() {
          alert(\`Quiz terminé! Score: \${this.score}/\${this.totalQuestions}\`);
        }
      }

      // Initialiser le quiz
      document.addEventListener('DOMContentLoaded', () => {
        new QuizManager();
      });
    `;
  }
}

// Factory pour créer différents types de générateurs
export function createHTMLGenerator(type: 'quiz' | 'trueFalse' | 'caseStudy', options?: HTMLGeneratorOptions) {
  switch (type) {
    case 'quiz':
      return new HTMLGenerator(options);
    // Ajouter d'autres types plus tard
    default:
      return new HTMLGenerator(options);
  }
}