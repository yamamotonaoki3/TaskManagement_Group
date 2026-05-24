import './App.css';

import { Navigate, Route, Routes } from 'react-router-dom';

import { CompletedTasksPage } from './components/CompletedTasksPage/CompletedTasksPage';
import { KanbanBoard } from './components/KanbanBoard/KanbanBoard';
import { LoginPage } from './components/LoginPage/LoginPage';
import { RegisterPage } from './components/RegisterPage/RegisterPage';
import { ProtectedRoute } from './router/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<KanbanBoard />} />
        <Route path="/completed" element={<CompletedTasksPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
