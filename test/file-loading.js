const fetchUrl = require('fetch').fetchUrl;
const expect = require('chai').expect;

const config = { port:3000, dir:`${__dirname}/mocks` };
const baseUrl = 'http://localhost:3000';

delete require.cache[require.resolve('../src')];
const mockedApi = require('../src').setup(config);

describe('file loading', () => {
  before((done) => {
    mockedApi.start().then(done, done);
  });

  after(() => {
    mockedApi.stop();
  });

  beforeEach(() => {
    mockedApi.reset();
  });

  describe('when file exists', () => {
    it('returns json from file directly in mock-dir', (done) => {
      fetchUrl(`${baseUrl}/42.json`, (err, meta, body) => {
        expect(meta.status).to.equal(200);

        const json = JSON.parse(body.toString());
        expect(json.title).to.equal('Mock 42');
        expect(json.list).to.eql([1, 2, 3]);

        done();
      });
    });

    it('returns json from file nested in mock-dir', (done) => {
      fetchUrl(`${baseUrl}/deeply/nested/42.json`, (err, meta, body) => {
        expect(meta.status).to.equal(200);

        const json = JSON.parse(body.toString());
        expect(json.title).to.equal('Nested mock');
        expect(json.list).to.eql([10, 20, 30]);

        done();
      });
    });

    describe('when extension is not given', () => {
      it('returns json from file', (done) => {
        fetchUrl(`${baseUrl}/extensions/42`, (err, meta, body) => {
          expect(meta.status).to.equal(200);

          const json = JSON.parse(body.toString());
          expect(json.title).to.equal('Mock 42');
          expect(json.list).to.eql([1, 2, 3]);

          done();
        });
      });

      it('returns json from file within a directory of the same name', (done) => {
        fetchUrl(`${baseUrl}/extensions/42/43`, (err, meta, body) => {
          expect(meta.status).to.equal(200);

          const json = JSON.parse(body.toString());
          expect(json.title).to.equal('Mock 43');
          expect(json.list).to.eql([4, 5, 6]);

          done();
        });
      });
    });
  });

  describe('when file does not exist', () => {
    it('returns 404', (done) => {
      fetchUrl(`${baseUrl}/does-not-exist.json`, (err, meta, body) => {
        expect(meta.status).to.equal(404);
        done();
      });
    });
  });
});
