import { ErrorBoundary } from "./components/ErrorBoundary";
import { TerminalQuizApp } from "./components/TerminalQuizApp";

function App() {
  return (
    <ErrorBoundary>
      <TerminalQuizApp />
    </ErrorBoundary>
  );
}

export default App;
