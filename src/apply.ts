import {
  ArrayOperation,
  DraftType,
  MapOperation,
  ObjectOperation,
  SetOperation,
} from './constant';
import { create } from './create';
import type { Options, Patches } from './interface';
import { deepClone, isPath } from './utils';

export function getValue(target: object, path: (string | number)[]) {
  let current: any = target;
  for (let i = 0; i < path.length - 1; i++) {
    const key = `${path[i]}`;
    if (current instanceof Map) {
      current = current.get(Array.from(current.keys())[key as any]);
    } else if (current instanceof Set) {
      current = Array.from(current.values())[key as any];
    } else {
      current = current[key];
    }
  }
  return current;
}

/**
 * apply patches
 */
export function apply<T extends object, F extends boolean = false>(
  baseState: T,
  patches: Patches,
  options?: Pick<
    Options<false, F>,
    Exclude<keyof Options<false, F>, 'enablePatches'>
  >
) {
  return create<T, F>(
    baseState,
    (draft) => {
      patches.forEach(([[type, operation], paths, args]) => {
        const params: any[] = args.map((arg) =>
          isPath(arg)
            ? getValue(draft, [...arg[0].slice(1), null])
            : deepClone(arg)
        );
        for (const path of paths) {
          const [key] = path.slice(-1);
          const current = getValue(draft, path);
          if (typeof current === 'undefined') continue;
          if (type === DraftType.Object) {
            switch (operation) {
              case ObjectOperation.Delete:
                delete current[key];
                return;
              case ObjectOperation.Set:
                current[key] = params[0];
                return;
            }
          } else if (type === DraftType.Array) {
            switch (operation) {
              case ArrayOperation.Pop:
              case ArrayOperation.Push:
              case ArrayOperation.Shift:
              case ArrayOperation.Splice:
              case ArrayOperation.Unshift:
                current[key][operation](...params);
                return;
              case ArrayOperation.Delete:
                delete current[key];
                return;
              case ArrayOperation.Set:
                current[key] = params[0];
                return;
            }
          } else if (type === DraftType.Map) {
            switch (operation) {
              case MapOperation.Delete:
                current.delete(Array.from(current.keys())[key as any]);
                return;
              case MapOperation.Set:
                if (current.size > key) {
                  const values: any[][] = Array.from(current.entries());
                  values.splice(key as number, 1, params);
                  current.clear();
                  for (const value of values) {
                    current.set(...value);
                  }
                } else {
                  current.set(...params);
                }
                return;
              case MapOperation.Clear:
                current.clear();
                return;
              case MapOperation.Construct:
                current.clear();
                params.forEach(([key, value]) => current.set(key, value));
                return;
            }
          } else if (type === DraftType.Set) {
            switch (operation) {
              case SetOperation.Delete:
                current.delete(Array.from(current.values())[key as any]);
                return;
              case SetOperation.Add:
                if (current.size > key) {
                  const values = Array.from(current.values());
                  values.splice(key as number, 0, params[0]);
                  current.clear();
                  for (const value of values) {
                    current.add(value);
                  }
                } else {
                  current.add(params[0]);
                }
                return;
              case SetOperation.Clear:
                current.clear();
                return;
              case SetOperation.Construct:
                current.clear();
                params.forEach((value) => current.add(value));
                return;
            }
          }
        }
      });
    },
    {
      enablePatches: false,
      ...options,
    }
  );
}
