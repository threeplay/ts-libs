import {schemaWithVersion} from './interface';

describe('schemaWithVersion', () => {
    it('should return composed name', async () => {
        expect(schemaWithVersion('a', '5')).to.equal('a:5');
    });
});
