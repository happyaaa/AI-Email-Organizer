"use client";

import * as React from "react";
import {
  AlertCircle,
  Archive,
  ArchiveX,
  File,
  Inbox,
  LucideIcon,
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
import { type Mail, type Folder } from "@/components/data";
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
  const [folders, setFolders] = React.useState<Folder[]>([]);
  const DEFAULT_FOLDER_NAMES = [
    "Inbox",
    "Drafts",
    "Sent Items",
    "Deleted Items",
    "Junk Email",
    "Archive",
    "Notes",
  ];
  const [selectedFolder, setSelectedFolder] = React.useState<Folder | null>(
    null
  );
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
    };
  }

  function mapOutlookFolder(rawFolder: any): Folder {
    return {
      id: rawFolder.id,
      displayName: rawFolder.displayName ?? "Unknown Folder",
      parentFolderId: rawFolder.parentFolderId,
      childFolderCount: rawFolder.childFolderCount ?? 0,
      unreadItemCount: rawFolder.unreadItemCount ?? 0,
      totalItemCount: rawFolder.totalItemCount ?? 0,
      variant: rawFolder.displayName === "Inbox" ? "default" : "ghost",
    };
  }

  const handleLinkClick = async (folderId: string) => {
    try {
      const clickedFolder = folders.find((f) => f.id === folderId);
      if (!clickedFolder) return;
  
      setSelectedFolder(clickedFolder);
  
      const response = await fetch(`${config.api.baseUrl}/api/mail?folder_id=${folderId}`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch mails: ${response.status}`);
      }
  
      const emailsData = await response.json();
      setEmails(emailsData.value.map(mapOutlookEmail));
    } catch (error) {
      console.error(error);
      alert("Failed to load mails. Please try again.");
    }
  };
  React.useEffect(() => {
    async function fetchFoldersAndEmails() {
      try {
        // Fetch folders first
        const foldersResponse = await fetch(`${config.api.baseUrl}/api/mail/folders`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });
  
        if (!foldersResponse.ok) {
          throw new Error(`Failed to fetch folders: ${foldersResponse.status}`);
        }
  
        const foldersData = await foldersResponse.json();
        const mappedFolders = foldersData.value.map(mapOutlookFolder);
        setFolders(mappedFolders);
  
        // Find the "Inbox" folder
        const inboxFolder = mappedFolders.find((folder: Folder) => folder.displayName === "Inbox");
  
        if (inboxFolder) {
          setSelectedFolder(inboxFolder);
  
          // Now fetch emails for the selected Inbox folder
          const emailsResponse = await fetch(`${config.api.baseUrl}/api/mail?folder_id=${inboxFolder.id}`, {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          });
  
          if (!emailsResponse.ok) {
            throw new Error(`Failed to fetch mails: ${emailsResponse.status}`);
          }
  
          const emailsData = await emailsResponse.json();
          setEmails(emailsData.value.map(mapOutlookEmail));
        } else {
          console.error("Inbox folder not found!");
        }
      } catch (error) {
        console.error(error);
        alert("Failed to load folders or mails. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  
    fetchFoldersAndEmails();
  }, [token]);
  
  const folderIconMap: Record<string, LucideIcon> = {
    "Inbox": Inbox,
    "Drafts": File,
    "Sent Items": Send,
    "Deleted Items": Trash2,
    "Junk Email": ArchiveX,
    "Archive": Archive,
    "Notes": File,
  };

  const defaultFolders = folders.filter((folder) =>
    DEFAULT_FOLDER_NAMES.includes(folder.displayName)
  );


  defaultFolders.sort(
    (a, b) =>
      DEFAULT_FOLDER_NAMES.indexOf(a.displayName) -
      DEFAULT_FOLDER_NAMES.indexOf(b.displayName)
  );
  
  const customFolders = folders.filter((folder) =>
    !DEFAULT_FOLDER_NAMES.includes(folder.displayName)
  );

  const defaultNavLinks = defaultFolders.map((folder) => ({
    id: folder.id,
    title: folder.displayName,
    label: folder.unreadItemCount > 0 ? folder.unreadItemCount.toString() : "",
    icon: folderIconMap[folder.displayName] || Inbox, // fallback if not found
    variant: (selectedFolder?.id === folder.id ? "default" : "ghost") as "default" | "ghost",
  }));

const customNavLinks = customFolders.map((folder) => ({
  id: folder.id,
  title: folder.displayName,
  label: folder.unreadItemCount > 0 ? folder.unreadItemCount.toString() : "",
  icon: File, // You can use different icons for custom folders
  variant: (selectedFolder?.id === folder.id ? "default" : "ghost") as "default" | "ghost",
}));
  
  if (loading) return <div>Loading...</div>;
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
            links={defaultNavLinks}
            onLinkClick={handleLinkClick}
          />
          <Separator />
          <Nav
            isCollapsed={isCollapsed}
            links={customNavLinks}
            onLinkClick={handleLinkClick}
          />
          <iframe
            src="https://copilotstudio.microsoft.com/environments/Default-44467e6f-462c-4ea2-823f-7800de5434e3/bots/cr29b_testmj_nLm/webchat?__version__=2"
            frameBorder="0"
            className="w-full h-[500px]"
          ></iframe>
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
