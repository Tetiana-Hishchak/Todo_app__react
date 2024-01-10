/* eslint-disable jsx-a11y/control-has-associated-label */
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect, useMemo, useState,
} from 'react';
import * as todosService from './api/todosService';
import { Todo } from './types/Todo';
import { Selected } from './types/Selected';
import { UserWarning } from './UserWarning';
import { Header } from './components/Header';
import { TodoList } from './components/TodoList';
import { FilterTodos } from './components/FilterTodos';
import { ErrorMessage } from './components/ErrorMessage';
import { ErrorMessages } from './types/ErrorMessages';

const USER_ID = 11281;

function getPreparedTodos(
  todos: Todo[], selected: Selected,
) {
  switch (selected) {
    case Selected.ACTIVE: {
      return todos.filter(todo => !todo.completed);
    }

    case Selected.COMPLETED: {
      return todos.filter(todo => todo.completed);
    }

    default:
      return todos;
  }
}

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(ErrorMessages.EMPTY);
  const [selected, setSelected]
  = useState<Selected>(Selected.ALL);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [isLoadingId, setIsLoadingId] = useState<number | null>(null);
  const [loadingIds, setLoadingIds] = useState<number[]>([]);

  useEffect(() => {
    setIsLoading(true);
    todosService.getTodos(USER_ID)
      .then(setTodos)
      .catch(error => setErrorMessage(error.message || ErrorMessages.GET))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (errorMessage) {
      setTimeout(() => {
        setErrorMessage(ErrorMessages.EMPTY);
      }, 3000);
    }
  }, [errorMessage]);

  const visibleTodos = useMemo(
    () => getPreparedTodos(todos, selected),
    [todos, selected],
  );
  const amountTodos = visibleTodos.length;
  const hascompletedTodos = useMemo(
    () => visibleTodos.some(todo => todo.completed), [visibleTodos],
  );
  const activeTodos = useMemo(
    () => todos.filter(todo => !todo.completed), [visibleTodos],
  );
  const amountActive = activeTodos.length;
  const deleteTodo = (todoId: number) => {
    setLoadingIds(current => [
      ...current,
      todoId,
    ]);

    return todosService.deleteTodo(todoId)
      .then(() => setTodos(currentTodos => currentTodos
        .filter(todo => todo.id !== todoId)))
      .catch((error) => {
        setTodos(todos);
        setErrorMessage(ErrorMessages.DELETE);
        throw error;
      })
      .finally(() => {
        setLoadingIds(current => current.filter(id => id !== todoId));
        setIsLoadingId(null);
      });
  };

  const addTodo = ({
    title, completed, userId,
  }: Todo) => {
    setIsLoadingId(0);
    setTempTodo({
      id: 0,
      userId,
      title,
      completed,
    });
    setErrorMessage(ErrorMessages.EMPTY);

    // eslint-disable-next-line no-console
    console.log(tempTodo);

    return todosService.creatTodo({ title, completed, userId })
      .then((newTodo) => setTodos((current) => [...current, newTodo]))
      .catch((error) => {
        setErrorMessage(ErrorMessages.ADD);
        throw error;
      })
      .finally(() => {
        setTempTodo(null);
        setIsLoadingId(null);
      });
  };

  const updateTodo = (updatedTodo: Todo) => {
    setErrorMessage(ErrorMessages.EMPTY);
    setIsLoadingId(updatedTodo.id);
    setLoadingIds(current => [
      ...current,
      updatedTodo.id,
    ]);

    return todosService.updateTodo(updatedTodo)
      .then(todo => {
        setTodos(currentTodos => {
          const newPosts = [...currentTodos];
          const index = newPosts.findIndex(post => post.id === updatedTodo.id);

          newPosts.splice(index, 1, todo);

          return newPosts;
        });
      })
      .catch((error) => {
        setErrorMessage(ErrorMessages.UPDATE);
        throw error;
      })
      .finally(() => {
        setLoadingIds(current => current.filter(id => id !== updatedTodo.id));
        setIsLoadingId(null);
      });
  };

  const clearCompleted = useCallback(() => {
    const todosCompleted = todos.filter(todo => todo.completed);

    todosCompleted.forEach(todo => deleteTodo(todo.id));
  }, [todos]);

  const handleToggleTodosAll = () => (
    amountActive > 0
      ? todos.map(todo => todo.completed === false
        && updateTodo({ ...todo, completed: !todo.completed }))
      : todos.map(todo => (
        updateTodo({ ...todo, completed: !todo.completed })))
  );

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>
      {!isLoading && (
        <div className="todoapp__content">
          <Header
            amountTodos={amountTodos}
            userId={USER_ID}
            setErrorMessage={setErrorMessage}
            onSubmit={addTodo}
            amountActive={amountActive}
            handleToggleTodosAll={handleToggleTodosAll}
          />

          {tempTodo && (
            <div className="todo">
              <label className="todo__status-label">
                <input type="checkbox" className="todo__status" />
              </label>

              <span className="todo__title">{tempTodo.title}</span>
              <button type="button" className="todo__remove">×</button>

              <div className={classNames(
                'modal overlay',
                { 'is-active': isLoadingId === tempTodo.id },
              )}
              >
                <div className="modal-background has-background-white-ter" />
                <div className="loader" />
              </div>
            </div>
          )}
          {todos.length !== 0 && (
            <>
              <TodoList
                todos={visibleTodos}
                onDelete={deleteTodo}
                tempTodo={tempTodo}
                isLoadingId={isLoadingId}
                updateTodo={updateTodo}
                loadingIds={loadingIds}
              />
              <FilterTodos
                amountActive={amountActive}
                hascompletTodos={hascompletedTodos}
                selected={selected}
                setSelected={setSelected}
                clearCompleted={clearCompleted}
              />
            </>
          )}
        </div>
      )}

      {errorMessage && (
        <ErrorMessage
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
    </div>
  );
};
