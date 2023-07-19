import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Overview } from '../dashboard/overview';
import { InProgressTab } from '../dashboard/in-progress-tab';
import { SolutionsTab } from '../dashboard/solutions-tab';
import type { User } from '@prisma/client';
import { getRelativeTime } from '~/utils/relativeTime';
import { prisma } from '~/server/db';
import UserHeader from './user-header';
import { Button } from '~/components/ui/button';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '~/server/auth';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import { MagicIcon } from '~/components/ui/magic-icon';
import { stripProtocolAndWWW } from '~/utils/stringUtils';

interface Props {
  // TODO: how do do this union type with just letting prisma halp
  user: User & { userLinks: { id: string | null; url: string }[] };
}

export type UserData = NonNullable<Awaited<ReturnType<typeof getUserdata>>>;
async function getUserdata(id: string) {
  const userData = await prisma.user.findFirst({
    where: {
      id,
    },
    include: {
      submission: {
        where: {
          userId: id,
        },
        orderBy: [
          {
            createdAt: 'desc',
          },
        ],
        take: 10,
        include: {
          challenge: true,
        },
      },
    },
  });

  return userData;
}

export default async function Dashboard({ user }: Props) {
  const userData = await getUserdata(user.id);
  const session = await getServerSession(authOptions);

  // TODO: this seems sus
  if (!userData) {
    return null;
  }

  return (
    <div className="container">
      <div className="flex-1 space-y-4 mt-10">
        <div className="flex gap-4">
          <div className="flex pace-x-2">
            <Image
              className="rounded-3xl"
              alt="user avatar"
              width="100"
              height="100"
              src={user.image ?? '/avatar.jpeg'}
            />
          </div>
          <div className="flex w-full justify-between">
            <div>
              <UserHeader user={user} />
              <p
                className="text-sm italic tracking-tight"
                title={`Joined ${user.createdAt.toString()}`}
              >
                Joined {getRelativeTime(user.createdAt)}
              </p>
            </div>
            <div>
              {session?.user.id === user.id && (
                <Link href="/settings">
                  <Button variant="outline">Edit Profile</Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-md">
          <ReactMarkdown>{user.bio}</ReactMarkdown>
        </div>

        {user.userLinks.length > 0 && (
          <div>
            {user.userLinks
              .filter((item) => item.url !== '')
              .map((link) => (
                <div className="flex gap-2" key={link.id}>
                  <MagicIcon url={link.url} />
                  <a
                    className="hover:text-zinc-400"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {stripProtocolAndWWW(link.url)}
                  </a>
                </div>
              ))}
          </div>
        )}

        <Tabs defaultValue="in-progress" className="space-y-4">
          <TabsList className="rounded-full border border-border bg-background">
            <TabsTrigger
              className="rounded-lg rounded-l-2xl duration-300 data-[state=active]:bg-border"
              value="in-progress"
            >
              In-Progress
            </TabsTrigger>
            <TabsTrigger
              className="rounded-lg duration-300 data-[state=active]:bg-border"
              value="solutions"
            >
              Solutions
            </TabsTrigger>
            <TabsTrigger
              className="rounded-lg duration-300 data-[state=active]:bg-border"
              value="bookmarks"
              disabled
            >
              Bookmarks
            </TabsTrigger>
            <TabsTrigger
              className="rounded-l-lg rounded-r-full duration-300 data-[state=active]:bg-border"
              value="comments"
              disabled
            >
              Comments
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <Overview />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="in-progress" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>In-Progress</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <InProgressTab />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="solutions" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Solutions</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <SolutionsTab submissions={userData.submission} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
