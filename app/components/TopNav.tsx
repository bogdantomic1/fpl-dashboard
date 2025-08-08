'use client';

import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';

export default function TopNav() {
  return (
    <div className="w-full border-b bg-background">
      {/* full-bleed; no centering container */}
      <div className="px-0">
        <NavigationMenu>
          <NavigationMenuList className="justify-start">
            {/* Dashboard (root) */}
            <NavigationMenuItem>
              <Link href="/" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Dashboard
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            {/* My team -> Pick team */}
            <NavigationMenuItem>
              <NavigationMenuTrigger>My team</NavigationMenuTrigger>
              <NavigationMenuContent className="p-3 min-w-[320px] md:min-w-[420px]">
                <ul className="grid gap-2">
                  <li>
                    <Link href="/pickteam" legacyBehavior passHref>
                      <NavigationMenuLink className="block rounded-md p-3 hover:bg-muted">
                        <div className="text-sm font-medium leading-none">
                          Pick team
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground leading-snug">
                          Set your XI, bench order, and captaincy for the next
                          gameweek. See fixture difficulty and form at a glance.
                        </p>
                      </NavigationMenuLink>
                    </Link>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Docs */}
            <NavigationMenuItem>
              <Link href="/docs" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Docs
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
}
