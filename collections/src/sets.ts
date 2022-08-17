export class Sets {
    public static union<T>(a: Set<T>, b: Set<T>): Set<T> {
        const union = new Set<T>();
        a.forEach(v => union.add(v));
        b.forEach(v => union.add(v));
        return union;
    }

    public static hasIntersection<T>(setA: Set<T>, setB: Set<T>): boolean {
        for (const v of setA.values()) {
            if (setB.has(v)) {
                return true;
            }
        }
        return false;
    }
}
