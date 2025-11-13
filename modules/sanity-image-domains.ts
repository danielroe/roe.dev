import { defineNuxtModule, useRuntimeConfig } from 'nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import { createClient } from '@sanity/client'

interface ModuleOptions {
  enabled: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'sanity-image-domains',
    configKey: 'sanityImageDomains',
  },
  defaults: {
    enabled: true,
  },
  async setup (options: ModuleOptions, nuxt: Nuxt) {
    if (!options.enabled || nuxt.options.dev || nuxt.options._prepare) {
      return
    }

    const runtimeConfig = useRuntimeConfig()

    if (!runtimeConfig.sanity?.token) {
      console.log('⚠️ [sanity-image-domains] Sanity token not found - skipping dynamic image domains')
      return
    }

    try {
      const client = createClient({
        projectId: '9bj3w2vo',
        dataset: 'production',
        token: runtimeConfig.sanity.token,
        apiVersion: '2025-02-19',
        useCdn: false,
      })

      const urlQuery = `*[
          _type in ["talk", "entity", "uses", "ama", "invite", "talkGroup"]
        ] {
          _type,
          "talkImages": select(_type == "talk" => image.asset->url),
          "entityLogos": select(_type == "entity" => logo.asset->url), 
          "usesItemImages": select(_type == "uses" => items[].image.asset->url),
          "amaImages": select(_type == "ama" => image.asset->url),
          "inviteImages": select(_type == "invite" => image.asset->url),
          "talkGroupImages": select(_type == "talkGroup" => image.asset->url),
          "eventLinks": select(_type == "talk" && defined(link) => link),
          "videoUrls": select(_type == "talk" && defined(video) => video),
          "demoUrls": select(_type == "talk" && defined(demo) => demo),
          "repoUrls": select(_type == "talk" && defined(repo) => repo),
          "websiteUrls": select(_type == "entity" && defined(website) => website),
          "externalLinks": select(_type == "uses" => items[].links[].url)
        }`

      type URLQueryResponse = {
        _type: string
        talkImages?: string[]
        entityLogos?: string[]
        usesItemImages?: string[]
        amaImages?: string[]
        inviteImages?: string[]
        talkGroupImages?: string[]
        eventLinks?: string[]
        videoUrls?: string[]
        demoUrls?: string[]
        repoUrls?: string[]
        websiteUrls?: string[]
        externalLinks?: string[]
      }

      const results = await client.fetch<URLQueryResponse[]>(urlQuery)

      const domains = new Set<string>()

      for (const item of results) {
        const allUrls = [
          item.talkImages,
          item.entityLogos,
          item.usesItemImages,
          item.amaImages,
          item.inviteImages,
          item.talkGroupImages,
          item.eventLinks,
          item.videoUrls,
          item.demoUrls,
          item.repoUrls,
          item.websiteUrls,
          ...(item.externalLinks || []),
        ].flat()

        for (const url of allUrls) {
          if (url) {
            try {
              const domain = new URL(url).hostname
              domains.add(domain)

              if (domain.includes('youtube')) {
                domains.add('i.ytimg.com')
                domains.add('img.youtube.com')
              }
              if (domain.includes('vimeo')) {
                domains.add('i.vimeocdn.com')
              }
              if (domain.includes('twitch')) {
                domains.add('static-cdn.jtvnw.net')
              }
              if (domain.includes('github')) {
                domains.add('avatars.githubusercontent.com')
                domains.add('raw.githubusercontent.com')
              }
            }
            catch {
              // Ignore invalid URLs
            }
          }
        }
      }

      const dynamicDomains = Array.from(domains).sort()

      if (dynamicDomains.length > 0) {
        console.log('✅ [sanity-image-domains] Found', dynamicDomains.length, 'dynamic image domains from Sanity')

        // Get current domains from config
        const currentDomains = nuxt.options.image?.domains || []

        // Add dynamic domains to the existing ones, avoiding duplicates
        const allDomains = Array.from(new Set([...currentDomains, ...dynamicDomains]))

        // Update the image configuration
        nuxt.options.image = nuxt.options.image || {}
        nuxt.options.image.domains = allDomains

        console.log('✅ [sanity-image-domains] Total domains now:', allDomains.length)
      }
      else {
        console.log('ℹ️ [sanity-image-domains] No dynamic image domains found in Sanity content')
      }
    }
    catch (error) {
      console.error('❌ [sanity-image-domains] Failed to fetch dynamic image domains from Sanity:', error)
    }
  },
})
