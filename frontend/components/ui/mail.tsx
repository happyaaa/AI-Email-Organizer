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
  Plus,
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
  const [showComposeDialog, setShowComposeDialog] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filteredEmails, setFilteredEmails] = React.useState<any[]>([]);
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
    if (!outlookEmail) return null;
    
    return {
      id: outlookEmail.id || "",
      name: outlookEmail.from?.emailAddress?.name || "Unknown Sender",
      email: outlookEmail.from?.emailAddress?.address || "",
      subject: outlookEmail.subject || "(No Subject)",
      text: outlookEmail.body?.content || "", 
      preview: outlookEmail.bodyPreview || "",
      date: outlookEmail.receivedDateTime || new Date().toISOString(),
      read: outlookEmail.isRead || false,
      labels: outlookEmail.categories || []
    };
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    try {
      const response = await fetch(`${config.api.baseUrl}/api/mail/search`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          top: 10
        })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Search results:", data);
      setFilteredEmails(data.value.map(mapOutlookEmail));
      
    } catch (error) {
      console.error("Search failed:", error);
    }
  };
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

  const fetchEmails = async () => {
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
      console.log("Fetched emails:", data);
      setEmails(data.value.map(mapOutlookEmail));
    } catch (error) {
      console.error("Failed to fetch emails:", error);
      alert("Failed to load mails. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchEmails();
  }, [token]);

  const ComposeDialog = React.memo(() => {
    const [to, setTo] = React.useState("");
    const [subject, setSubject] = React.useState("");
    const [content, setContent] = React.useState("");
    const [sending, setSending] = React.useState(false);

    const handleSubmit = async () => {
      if (!to || !subject || !content) {
        alert("Please fill in all fields");
        return;
      }

      setSending(true);
      try {
        console.log("Sending email with data:", { to, subject, content });
        
        const response = await fetch(`${config.api.baseUrl}/api/mail/compose`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to,
            subject,
            content
          })
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.detail || 'Failed to send email');
        }

        alert("Email sent successfully");
        setShowComposeDialog(false);
        setTo("");
        setSubject("");
        setContent("");
        
    
        try {
          await fetchEmails();
        } catch (error) {
          console.error("Failed to refresh emails:", error);
        }
      } catch (error) {
        console.error("Failed to send email:", error);
        alert(error instanceof Error ? error.message : "Failed to send email");
      } finally {
        setSending(false);
      }
    };

    return (
      <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your message here..."
                required
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleSubmit} 
              disabled={sending || !to || !subject || !content}
            >
              {sending ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  });

  
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
              <form onSubmit={(e) => {
                e.preventDefault();  
              }}>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search" 
                    className="pl-8" 
                    onChange={(e) => {
                      handleSearch(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); 
                      }
                    }}
                  />
                </div>
              </form>
            </div>
            <TabsContent value="all" className="m-0">
              <MailList items={searchQuery ? filteredEmails : emails} />
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
      <ComposeDialog />
    </TooltipProvider>
  );
}
