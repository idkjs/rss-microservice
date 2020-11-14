import { Application } from "https://deno.land/x/oak/mod.ts";
import { Feed } from "https://jspm.dev/feed";

const port = 3000;
const app = new Application();

const spaceXApi = "https://api.spacex.land/graphql/";

const query = `#graphql
{
  launchesPast(sort: "desc" limit: 20) {
    mission_name
    launch_date_local
    links {
      article_link
      video_link
    }
    rocket {
      rocket_name
    }
  }
}
`;
app.use(async (ctx, next) => {
  const res = await fetch(spaceXApi, {
    body: JSON.stringify({ query }),
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  const myFeed = new Feed({
    title: "The Most Average Space X RSS Feed ™",
    description: "A feed of stuff that Space X be doin",
    link: "https://spaceflightnow.com",
    updated: new Date(),
  });
  // deno-lint-ignore no-explicit-any
  data.data.launchesPast.forEach((launch: any) => {
    myFeed.addItem({
      title: launch.mission_name,
      id: launch.links.article_link,
      link: launch.links.article_link || launch.links.video_link,
      description: `Smart people put a ${launch.rocket.rocket_name} in space`,
      date: new Date(launch.launch_date_local),
    });
  });
  ctx.response.body = myFeed.rss2();
  // we need to set the MIME type for this to be valid RSS
  ctx.response.headers.set("Content-Type", "application/rss+xml");
  await next();
});

app.addEventListener("error", (e) => {
  console.log("Error: ", e.error);
});
app.addEventListener("listen", () => {
  console.log(`Listening on http://localhost:${port}`);
});

app.listen({ port });
