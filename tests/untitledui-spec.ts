import { test } from "@playwright/test";
import { BlockCrawler } from "ui-blocks-crawler";

test("untitledui", async ({ page }) => {
  const crawler = new BlockCrawler({
    startUrl: "https://www.untitledui.com/react/components",
    collectionLinkLocator: "a",
    collectionNameLocator: "h3",
    collectionCountLocator: "p",
    getTabSection: (page) => {
      return page.locator('xpath=//section[3]/div/div')
    },
  });
});