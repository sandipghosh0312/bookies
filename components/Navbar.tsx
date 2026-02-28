"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs'
import { navItems } from '@/constants/index'

const Navbar = () => {
  const pathName = usePathname();
  const { user } = useUser();
  return (
    <header className='w-full fixed z-50 bg-(--bg-primary)'>
        <div className="wrapper navbar-height py-4 flex justify-between items-center">
            <Link href='/' className='flex gap-0.5 items-center'>
                <img src="/assets/logo.png" alt="Bookies Logo" width={42} height={26} className='rounded-full' />
                <span className="logo-text">Bookies</span>
            </Link>

            <nav className="w-fit flex gap-7.5 items-center">
                {
                    navItems.map(({ label, href }) => {
                        const isActive = pathName === href || (href !== '/' && pathName.startsWith(href));
                        
                        return (
                            <Link className={`${isActive ? 'nav-link-active' : 'text-black'} nav-link-base hover:opacity-70`} href={href} key={label}>{label}</Link>
                        )
                    })
                }
                  <SignedOut>
                      <SignInButton mode='modal'>Authenticate</SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <div className="nav-user-link">
                      <UserButton />
                      {user?.firstName && (
                        <Link href="/subscriptions" className='nav-user-name'>{`Hey, ${user?.firstName}`}</Link>
                      )}
                    </div>
                  </SignedIn>
            </nav>
        </div>
    </header>
  )
}

export default Navbar;