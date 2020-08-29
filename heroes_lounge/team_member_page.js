const cheerio = require('cheerio');

function processDetails($) {
  const cards = $('.card p.card-text');
  const details = {};
  cards.each((i, card) => {
    const children = card.children;

    if (children.length > 2 && 
        children[1].name === 'img' &&
        children[1].attribs.src.includes('roles')) {
      details.role = children[2].data.trim()
      return;
    }    

    if (children.length > 2 && 
        children[1].name === 'img' &&
        children[1].attribs.src.includes('battlenet')) {
      details.bnetId = children[3].children[0].data.trim();
      details.heroesProfileUrl = children[3].attribs.href;

      return;
    }

    if (children.length > 2 && 
        children[1].name === 'img' &&
        children[1].attribs.src.includes('discord')) {
      details.discordId = children[2].data.trim();
      return;
    }

    if (children.length > 1 && 
        children[0].name === 'strong' &&
        children[0].children[0].data.includes('MMR')) {
      details.mmr = children[1].data.trim();
      return;
    } 

    if (children.length > 1 && 
        children[0].name === 'strong' &&
        children[0].children[0].data.includes('Country')) {
      details.country = children[1].data.trim();
      return;
    }

    if (children.length > 1 && 
        children[0].name === 'strong' &&
        children[0].children[0].data.includes('Description')) {
      details.description = children[2].data.trim();
      return;
    }

  });
  return details;
}

class TeamMemberPage {
  constructor(html) {
    this.$ = cheerio.load(html);
  }

  get name() {
    return this.$('.banner-custom-header h1').text().trim();
  }

  get role() {
    return this._details.role;
  }

  get bnetId() {
    return this._details.bnetId;
  }

  get heroesProfileUrl() {
    return this._details.heroesProfileUrl;
  }


  get discordId() {
    return this._details.discordId;
  }

  get mmr() {
    return this._details.mmr;
  }

  get country() {
    return this._details.country;
  }

  get description() {
   return this._details.description; 
  }

  get _details() {
    if (!this.details) {
      this.details = processDetails(this.$);
    }
    return this.details;
  }

  toJson() {
    return {
      name: this.name,
      role: this.role,
      bnetId: this.bnetId,
      heroesProfileUrl: this.heroesProfileUrl,
      discordId: this.discordId,
      mmr: this.mmr,
      country: this.country,
      description: this.description
    }
  }
}

exports.TeamMemberPage = TeamMemberPage;