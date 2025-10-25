import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchData } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
}

export default function Users() {
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      const { data, error } = await fetchData<User[]>(`${(import.meta as any).env.VITE_API_URL}/api/users`);
      if (error) {
        setError(error.message);
      } else if (data) {
        setUsers(data);
      }
    };
    loadUsers();
  }, []);

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs</CardTitle>
          <CardDescription>List of registred users</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {users.length === 0 && !error && <p>No users found</p>}
          <ul>
            {users.map((element) => (
              <li key={element.id}>
                {element.name} - {element.id}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
