import Link from "next/link"

import { APP_NAME, GITHUB_REPO_URL } from "@/constants"

import { Button } from "@/components/ui/button"
import { TranslatedText } from "@/components/shared/translated-text"

import { GithubSvg } from "./components"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t">
      <div className="flex-center p-2">
        {currentYear} {APP_NAME} &#x2022;{" "}
        <TranslatedText text="All Rights Reserved" /> &#x2022;
        <Link href={GITHUB_REPO_URL} target="_blank">
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <GithubSvg />
            <span className="sr-only">
              <TranslatedText text="Github link" />
            </span>
          </Button>
        </Link>
      </div>
    </footer>
  )
}
