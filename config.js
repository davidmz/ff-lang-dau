export default {
  database: {
    host: "localhost",
    port: 15432,
    database: "freefeed",
    username: "freefeed",
    password: "freefeed",
  },
  language: {
    code: "en",
    threshold: 0.2,
  },
  dauFrom: "2015-05-03",
  get usersFileName() {
    return `./result/users-${this.language.code}.txt`;
  },
  get dauFileName() {
    return `./result/dau-${this.language.code}.csv`;
  },
};
