const cheerio = require('cheerio');
const stringify = require('csv-stringify')
const util = require('util');

const { config } = require('../config');
const { cacheOperation, makeRequest } = require('../utils');
const { TeamPage } = require('./team_page');
const { TeamMemberPage } = require('./team_member_page');

const promisedStringify = util.promisify(stringify);

const HEROES_LOUNGE_URL = 'https://heroeslounge.gg';


async function getTeamMember(hlUserPageUrl, securityCookies) {
  const options = { url: hlUserPageUrl, headers: { cookie: securityCookies } };

  const userId = hlUserPageUrl.split('/').slice(-1)[0];
  const response = await cacheOperation(`hlUser-${userId}.html`, () => makeRequest(options));
  const { data: teamMemberHtml } = response;
  const teamMemberPage = new TeamMemberPage(teamMemberHtml);
  return teamMemberPage;
}

async function getSecurityCookies(username, password) {
  const { data: homepageHtml, headers: homepageHeaders } = await makeRequest(HEROES_LOUNGE_URL);

  $ = cheerio.load(homepageHtml);
  const hiddenInputs = $('form input[type=hidden]');

  const form = { login: username, password };
  hiddenInputs.each((_, e) => {
    form[e.attribs.name] = e.attribs.value;
  });  

  const cookie = homepageHeaders['set-cookie'][0].split(';')[0];

  const options = {
    url: HEROES_LOUNGE_URL,
    method: 'POST',
    headers: { cookie },
    form,
    simple: false,
  };

  const response = await makeRequest(options);
  if (response.status !== 302) {
    throw new Error(`Didn't get redirect after login`);
  }

  if (!response.headers['set-cookie'] || response.headers['set-cookie'].length !== 2) {
   throw new Error(`Expected cookie details missing: ${util.inspect(response.headers['set-cookie'])}`);
  }

  const cookies = response.headers['set-cookie'];
  return cookies.map((c) => c.split(';')[0]);
}

async function getTeam(hlTeamCode, username, password) {
  const url = `${HEROES_LOUNGE_URL}/team/view/${hlTeamCode}`;

  const [teamPageResponse, securityCookies] = await Promise.all([
    cacheOperation(`hlTeam-${hlTeamCode}.html`, async () => makeRequest(url)),
    getSecurityCookies(username, password),
  ])

  const { data: teamPageHtml } = teamPageResponse;

  const teamPage = new TeamPage(teamPageHtml);
  const teamMemberPagePromises = teamPage.userUrls.map((url) => getTeamMember(url, securityCookies));
  const teamMemberPages = await Promise.all(teamMemberPagePromises);
  for (const teamMemberPage of teamMemberPages) {
    teamPage.teamMemberPages.push(teamMemberPage);
  }

  return teamPage;
}

async function formatter(teamPage) {
  const { name: teamName } = teamPage.toJson();
  const data = teamPage.teamMemberPages.map((t) => Object.assign({ teamName }, t.toJson()));
  return promisedStringify(data, {header: true});
}

exports.getTeam = getTeam;
exports.formatter = formatter;

async function main() {
  const { username, password } = config.heroesLounge;
  const team = await getTeam(process.argv[2], username, password);
  const csv = await formatter(team)
  console.log(csv);
}

if (require.main === module) {
  main();
}