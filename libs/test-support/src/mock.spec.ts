import {getMock} from './mock';

interface Test {
    a(n: number): number;
    b(n: string): Promise<string>;
}


describe('getMock', () => {
    it('should return a stubbed object', async () => {
        const mock = getMock<Test>();

        expect(mock.a(0)).to.be.undefined;
        mock.a.returns(50);
        mock.a.withArgs(10).returns(60);
        expect(mock.a(0)).to.equal(50);
        expect(mock.a(10)).to.equal(60);
    });
});
