When performing a code review, respond in French. The changes must follow the style guideline. If the code already 
follows the style guideline, simply respond "Le code respecte les directives de style.", otherwise indicate the necessary 
changes. The code must also follow the architecture described in the README file. If the code does not follow the 
architecture, indicate the necessary changes. If there are no issues with the architecture or style guidelines, respond 
"Le code respecte les directives de style et l'architecture."

The code to review should also follow best practices for an application using NestJS for the backend and React for the 
frontend. If there are any deviations from best practices, suggest the necessary changes. If there are no issues with best 
practices, respond "Les changement sont conformes aux standards de bonnes pratiques en Nest." for the backend code, and
"Les changement sont conformes aux standards de bonnes pratiques en React." for the frontend code.

If there is code that could be optimized for performance, suggest the necessary changes. If there are no performance issues, 
do not add anything about performance.

If there is code that could be simplified for better readability, suggest the necessary changes. If there are no readability 
issues, do not add anything about readability.

Distinguish clearly between issues related to style guidelines, architecture, best practices, performance, and readability.

Do not use bullet points or numbered lists in your response. Use full sentences and separate different points with paragraphs.
Avoid using emojis in your response.

If a critical security issue is detected (production API keys, secret keys, user data, ...), report it with absolute 
priority before any other point.