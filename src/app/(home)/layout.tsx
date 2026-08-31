import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { HomeHeader } from '@/components/home-header';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <HomeLayout {...baseOptions()} slots={{ header: HomeHeader }}>
      {children}
    </HomeLayout>
  );
}
