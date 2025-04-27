"use client";

import * as React from "react";
import {
  AlertCircle,
  Archive,
  ArchiveX,
  File,
  Inbox,
  MessagesSquare,
  Search,
  Send,
  ShoppingCart,
  Trash2,
  Users2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
// import { AccountSwitcher } from "@/components/ui/account-switcher";
import { MailDisplay } from "@/components/ui/mail-display";
import { MailList } from "@/components/ui/mail-list";
import { Nav } from "@/components/ui/nav";
import { type Mail } from "@/components/data";
import { useMail } from "@/components/use-mail";
import { useSearchParams } from "next/navigation";
import { config } from "@/config";

interface MailProps {
  accounts: {
    label: string;
    email: string;
    icon: React.ReactNode;
  }[];
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

export function Mail({
  accounts,
  defaultLayout = [20, 32, 48],
  defaultCollapsed = false,
  navCollapsedSize,
}: MailProps) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const [mail] = useMail();
  const [loading, setLoading] = React.useState(true);
  const [emails, setEmails] = React.useState<any[]>([]);

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`${config.api.baseUrl}/api/mail/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete mail: ${response.status}`);
      }

      setEmails(emails.filter((email) => email.id !== id));
      mail.selected = null;
    } catch (error) {
      console.error(error);
      alert("Failed to delete mail. Please try again.");
    }
  }

  function mapOutlookEmail(outlookEmail: any) {
    return {
      id: outlookEmail.id,
      name: outlookEmail.from?.emailAddress?.name ?? "Unknown Sender",
      email: outlookEmail.from?.emailAddress?.address ?? "",
      subject: outlookEmail.subject ?? "(No Subject)",
      text: outlookEmail.body.content ?? "", // You can also use outlookEmail.body.content for full HTML
      preview: outlookEmail.bodyPreview ?? "",
      date: outlookEmail.receivedDateTime,
      read: outlookEmail.isRead ?? false,
      labels: [], // Graph API does not include labels by default. You can use categories or custom logic.
    }
  }
  
  React.useEffect(() => {
    async function fetchEmails() {
      try {
        const response = await fetch(`${config.api.baseUrl}/api/mail`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });
    
        if (!response.ok) {
          throw new Error(`Failed to fetch mails: ${response.status}`);
        }
    
        const data = await response.json();
        console.log(data);
        setEmails(data.value.map(mapOutlookEmail));
      } catch (error) {
        console.error(error);
        alert("Failed to load mails. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchEmails();
  }, [token]);
  if (loading) return <div>Loading...</div>;
  if (!emails.length) return <div>No emails found.</div>;
  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(
            sizes
          )}`;
        }}
        className="h-full items-stretch"
      >
        <ResizablePanel
          defaultSize={defaultLayout[0]}
          collapsedSize={navCollapsedSize}
          collapsible={true}
          minSize={15}
          maxSize={20}
          onCollapse={() => {
            setIsCollapsed(true);
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
              true
            )}`;
          }}
          onResize={() => {
            setIsCollapsed(false);
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
              false
            )}`;
          }}
          className={cn(
            isCollapsed &&
              "min-w-[50px] transition-all duration-300 ease-in-out"
          )}
        >
          <div
            className={cn(
              "flex h-[52px] items-center justify-center",
              isCollapsed ? "h-[52px]" : "px-2"
            )}
          >
            {/* <AccountSwitcher isCollapsed={isCollapsed} accounts={accounts} /> */}
          </div>
          <Separator />
          <Nav
            isCollapsed={isCollapsed}
            links={[
              {
                title: "Inbox",
                label: "128",
                icon: Inbox,
                variant: "default",
              },
              {
                title: "Drafts",
                label: "9",
                icon: File,
                variant: "ghost",
              },
              {
                title: "Sent",
                label: "",
                icon: Send,
                variant: "ghost",
              },
              {
                title: "Junk",
                label: "23",
                icon: ArchiveX,
                variant: "ghost",
              },
              {
                title: "Trash",
                label: "",
                icon: Trash2,
                variant: "ghost",
              },
              {
                title: "Archive",
                label: "",
                icon: Archive,
                variant: "ghost",
              },
            ]}
          />
          <Separator />
          <Nav
            isCollapsed={isCollapsed}
            links={[
              {
                title: "Social",
                label: "972",
                icon: Users2,
                variant: "ghost",
              },
              {
                title: "Updates",
                label: "342",
                icon: AlertCircle,
                variant: "ghost",
              },
              {
                title: "Forums",
                label: "128",
                icon: MessagesSquare,
                variant: "ghost",
              },
              {
                title: "Shopping",
                label: "8",
                icon: ShoppingCart,
                variant: "ghost",
              },
              {
                title: "Promotions",
                label: "21",
                icon: Archive,
                variant: "ghost",
              },
            ]}
          />
          <iframe src="https://copilotstudio.microsoft.com/environments/Default-44467e6f-462c-4ea2-823f-7800de5434e3/bots/cr29b_testmj_nLm/webchat?__version__=2" frameBorder="0" className="w-full h-[500px]"></iframe>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <Tabs defaultValue="all">
            <div className="flex items-center px-4 py-2">
              <h1 className="text-xl font-bold">Inbox</h1>
              <TabsList className="ml-auto">
                <TabsTrigger
                  value="all"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  All mail
                </TabsTrigger>
                <TabsTrigger
                  value="unread"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  Unread
                </TabsTrigger>
              </TabsList>
            </div>
            <Separator />
            <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <form>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search" className="pl-8" />
                </div>
              </form>
            </div>
            <TabsContent value="all" className="m-0">
              <MailList items={emails} />
            </TabsContent>
            <TabsContent value="unread" className="m-0">
              <MailList items={emails.filter((item) => !item.read)} />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
          <MailDisplay
            mail={emails.find((item) => item.id === mail.selected) || null}
            onDelete={handleDelete}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}
