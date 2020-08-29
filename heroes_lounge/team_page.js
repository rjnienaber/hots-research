const cheerio = require('cheerio');

class TeamPage {
  constructor(html) {
    this.$ = cheerio.load(html);
    this.teamMemberPages = [];
  }

  get userUrls() {
    return Object.entries(this.$('.blogPostWrapper > a'))
      .map((e) => e[1])
      .filter((a) => a.attribs)
      .map((a) => a.attribs.href);
  }

  toJson() {
    return {
      name: this.$('.banner-custom-header h1').text().trim(),
      members: this.teamMemberPages.map((t) => t.toJson()),
    }
  }
}

exports.TeamPage = TeamPage;