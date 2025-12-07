type AsyncCompareFn<T> = (a: T, b: T) => Promise<number>;

interface ComparisonCache<T> {
  get(a: T, b: T): number | undefined;
  set(a: T, b: T, result: number): void;
}

function createComparisonCache<T>(): ComparisonCache<T> {
  const cache = new Map<T, Map<T, number>>();

  return {
    get(a: T, b: T): number | undefined {
      const aMap = cache.get(a);
      if (aMap) {
        const result = aMap.get(b);
        if (result !== undefined) {
          return result;
        }
      }
      const bMap = cache.get(b);
      if (bMap) {
        const result = bMap.get(a);
        if (result !== undefined) {
          return -result;
        }
      }
      return undefined;
    },
    set(a: T, b: T, result: number): void {
      if (!cache.has(a)) {
        cache.set(a, new Map());
      }
      cache.get(a)!.set(b, result);
    },
  };
}

async function merge<T>(
  left: T[],
  right: T[],
  compare: AsyncCompareFn<T>,
  cache: ComparisonCache<T>
): Promise<T[]> {
  console.log(
    `[Merge] Starting merge of ${left.length} and ${right.length} items`
  );

  const pairs: [T, T][] = [];
  for (const l of left) {
    for (const r of right) {
      if (cache.get(l, r) === undefined) {
        pairs.push([l, r]);
      }
    }
  }

  if (pairs.length > 0) {
    console.log(`[Merge] Pre-fetching ${pairs.length} comparisons in parallel`);
    await Promise.all(
      pairs.map(async ([l, r]) => {
        const result = await compare(l, r);
        cache.set(l, r, result);
      })
    );
    console.log(`[Merge] Pre-fetch complete`);
  }

  const result: T[] = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    const leftItem = left[leftIndex];
    const rightItem = right[rightIndex];
    const comparison = cache.get(leftItem, rightItem)!;

    if (comparison <= 0) {
      result.push(leftItem);
      leftIndex++;
    } else {
      result.push(rightItem);
      rightIndex++;
    }
  }

  console.log(
    `[Merge] Merge complete, result has ${
      result.length + left.length - leftIndex + right.length - rightIndex
    } items`
  );
  return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
}

async function mergeSortRecursive<T>(
  arr: T[],
  compare: AsyncCompareFn<T>,
  cache: ComparisonCache<T>,
  depth: number = 0
): Promise<T[]> {
  console.log(`[MergeSort] Depth ${depth}: Processing ${arr.length} items`);
  if (arr.length <= 1) {
    return arr;
  }

  const mid = Math.floor(arr.length / 2);
  const left = arr.slice(0, mid);
  const right = arr.slice(mid);

  console.log(
    `[MergeSort] Depth ${depth}: Splitting into ${left.length} and ${right.length}`
  );
  const [sortedLeft, sortedRight] = await Promise.all([
    mergeSortRecursive(left, compare, cache, depth + 1),
    mergeSortRecursive(right, compare, cache, depth + 1),
  ]);

  console.log(
    `[MergeSort] Depth ${depth}: Merging ${sortedLeft.length} and ${sortedRight.length}`
  );
  return merge(sortedLeft, sortedRight, compare, cache);
}

export async function asyncMergeSort<T>(
  arr: T[],
  compare: AsyncCompareFn<T>
): Promise<T[]> {
  const cache = createComparisonCache<T>();
  return mergeSortRecursive([...arr], compare, cache);
}
