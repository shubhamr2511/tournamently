import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function Login() {
  const { slug = '' } = useParams();
  const { login, loading } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(slug, password);
      push('Welcome, admin', 'success');
      navigate(`/t/${slug}/dashboard`);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <Card glow="gold">
        <h1 className="font-display text-2xl tracking-wider mb-1">
          Admin Login
        </h1>
        <p className="text-xs text-text-secondary mb-5">
          Tournament: <span className="text-accent-yellow">{slug}</span>
        </p>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            label="Admin Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            error={error || undefined}
            autoFocus
          />
          <Button type="submit" loading={loading}>
            Enter
          </Button>
        </form>
      </Card>
    </div>
  );
}
