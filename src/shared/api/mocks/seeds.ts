import { faker } from '@faker-js/faker';
import type { components } from '@/shared/api/openapi';

type TaskItem = components['schemas']['TaskItem'];

export function seedTasks(count = 300): TaskItem[] {
  faker.seed(42);
  return Array.from({ length: count }, (_, index) => ({
    id: `task-${String(index + 1).padStart(4, '0')}`,
    title: faker.lorem.sentence({ min: 3, max: 7 }),
    memo: faker.lorem.paragraph({ min: 1, max: 3 }),
    status: faker.helpers.arrayElement(['TODO', 'DONE'] as const),
  }));
}
