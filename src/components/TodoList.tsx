import classNames from 'classnames';
import { Todo } from '../types/Todo';
import { TodoItem } from './TodoItem';

type Props = {
  todos: Todo[];
  onDelete: (id: number) => void;
  tempTodo: Todo | null;
  isLoadingId: number | null;
  updateTodo: (updatedTodo: Todo) => Promise<void>;
  loadingIds: number[];
};

export const TodoList: React.FC<Props> = ({
  todos, onDelete = () => {}, isLoadingId, updateTodo, loadingIds,
}) => {
  return (
    <section className="todoapp__main">
      {todos.map(todo => (
        <div
          key={todo.id}
          className={classNames('todo', {
            completed: todo.completed === true,
          })}
        >
          <TodoItem
            todo={todo}
            onDelete={onDelete}
            isLoadingId={isLoadingId}
            updateTodo={updateTodo}
            loadingIds={loadingIds}
          />
        </div>
      ))}
    </section>

  );
};
