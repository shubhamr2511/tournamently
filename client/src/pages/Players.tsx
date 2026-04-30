import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../services/api';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { PlayerCard } from '../components/player/PlayerCard';
import { CharacterPicker } from '../components/player/CharacterPicker';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTournament } from '../hooks/useTournament';
import { usePlayers } from '../hooks/usePlayers';
import type { IPlayer } from '../types';

export function Players() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { session, isAdminOf } = useAuth();
  const { push } = useToast();
  const { tournament } = useTournament(slug);
  const isAdmin = isAdminOf(slug);
  const { players, loading, reload } = usePlayers(tournament?._id);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<IPlayer | null>(null);

  if (!session && !isAdmin) {
    navigate(`/t/${slug}/login`);
    return null;
  }

  const locked = !!tournament?.fixturesGenerated;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="font-display text-3xl tracking-wider">Roster</h1>
          <p className="text-text-secondary text-sm">
            {players.length} player{players.length === 1 ? '' : 's'}
            {locked && (
              <Badge tone="red" className="ml-2">
                Locked: fixtures generated
              </Badge>
            )}
          </p>
        </div>
        {isAdmin && !locked && (
          <Button onClick={() => setAdding(true)}>+ Add Player</Button>
        )}
      </div>

      {loading ? (
        <PageLoader />
      ) : players.length === 0 ? (
        <EmptyState
          title="No players yet"
          description="Add at least 2 players to generate fixtures."
          action={
            isAdmin && (
              <Button onClick={() => setAdding(true)}>Add Player</Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {players.map((p) => (
            <PlayerCard
              key={p._id}
              player={p}
              slug={slug}
              onEdit={isAdmin ? () => setEditing(p) : undefined}
              onDelete={
                isAdmin && !locked
                  ? async () => {
                      if (!confirm(`Remove ${p.gamerTag}?`)) return;
                      try {
                        await api.delete(
                          `/tournaments/${tournament?._id}/players/${p._id}`,
                        );
                        push('Player removed', 'success');
                        reload();
                      } catch (err) {
                        push(getErrorMessage(err), 'error');
                      }
                    }
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {adding && tournament && (
        <PlayerFormModal
          tournamentId={tournament._id}
          characters={tournament.availableCharacters}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            reload();
          }}
        />
      )}
      {editing && tournament && (
        <PlayerFormModal
          tournamentId={tournament._id}
          characters={tournament.availableCharacters}
          characterLock={tournament.characterLock}
          player={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function PlayerFormModal({
  tournamentId,
  characters,
  characterLock,
  player,
  onClose,
  onSaved,
}: {
  tournamentId: string;
  characters: string[];
  characterLock?: boolean;
  player?: IPlayer;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { push } = useToast();
  const [name, setName] = useState(player?.name || '');
  const [gamerTag, setGamerTag] = useState(player?.gamerTag || '');
  const [department, setDepartment] = useState(player?.department || '');
  const [character, setCharacter] = useState(player?.character || '');
  const [bio, setBio] = useState(player?.bio || '');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { name, gamerTag, department, character, bio };
      if (player) {
        await api.put(
          `/tournaments/${tournamentId}/players/${player._id}`,
          payload,
        );
        push('Player updated', 'success');
      } else {
        await api.post(`/tournaments/${tournamentId}/players`, payload);
        push('Player added', 'success');
      }
      onSaved();
    } catch (err) {
      push(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const charLocked = !!(characterLock && player?.characterLocked);

  return (
    <Modal open onClose={onClose} title={player ? 'Edit Player' : 'New Player'}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Gamer Tag"
          value={gamerTag}
          onChange={(e) => setGamerTag(e.target.value)}
          required
        />
        <Input
          label="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />
        <Input
          label="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <div>
          <div className="font-display uppercase tracking-wider text-xs text-text-secondary mb-2">
            Character
            {charLocked && (
              <Badge tone="red" className="ml-2">
                Locked
              </Badge>
            )}
          </div>
          <CharacterPicker
            characters={characters}
            selected={character}
            disabled={charLocked}
            onSelect={setCharacter}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
