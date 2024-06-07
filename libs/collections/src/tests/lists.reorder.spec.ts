import {Lists} from '../lists';

describe('Lists.reorder', () => {
   const testSet = [
      { k: 1, v: 1 },
      { k: 2, v: 2 },
      { k: 3, v: 3 },
      { k: 4, v: 4 },
   ];

   it('should reorder items based on key', async () => {
      expect(Lists.reorder(testSet, [4, 3, 2, 1], item => item.k)).to.deep.equal([
          testSet[3], testSet[2], testSet[1], testSet[0],
      ]);
   });

   it('should complete items if missing keys', async () => {
      return expect(Lists.reorder(testSet, [3, 2], item => item.k)).to.deep.equal([
            testSet[2], testSet[1], testSet[0], testSet[3],
      ]);
   });
});
