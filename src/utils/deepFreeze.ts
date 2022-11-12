import { DraftType } from '../constant';
import { getType } from './draft';

function isFreezable(value: any) {
  return !(
    typeof value !== 'object' ||
    value === null ||
    value === undefined ||
    Object.isFrozen(value)
  );
}

export function deepFreeze(target: any) {
  if (Object.isFrozen(target)) return;
  const type = getType(target);
  switch (type) {
    case DraftType.Map:
      for (const [key, value] of target) {
        // todo: think about freezing keys
        // if (isFreezable(key)) {
        //   deepFreeze(key);
        // }
        if (isFreezable(value)) {
          deepFreeze(value);
        }
      }
      target.set =
        target.clear =
        target.delete =
          () => {
            throw new Error('Cannot modify frozen data');
          };
      break;
    case DraftType.Set:
      for (const value of target) {
        if (isFreezable(value)) {
          deepFreeze(value);
        }
      }
      target.add =
        target.clear =
        target.delete =
          () => {
            throw new Error('Cannot modify frozen data');
          };
      break;
    case DraftType.Array:
      Object.freeze(target);
      for (const value of target) {
        if (isFreezable(value)) {
          deepFreeze(value);
        }
      }
      break;
    default:
      Object.freeze(target);
      // ignore non-enumerable or symbol properties
      Object.keys(target).forEach((name) => {
        const value = target[name];
        if (isFreezable(value)) {
          deepFreeze(value);
        }
      });
  }
}
