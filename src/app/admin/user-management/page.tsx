"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAllUsers, type User } from "@/lib/data";
import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Users2, Gem, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";

function UserTableSkeleton() {
    return (
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Premium Status</TableHead>
                <TableHead>Admin Status</TableHead>
                <TableHead className="text-right">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell>
                             <div className="flex items-center gap-3">
                                <Skeleton className="h-9 w-9 rounded-full" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

const PAGE_SIZE = 10;

export default function UserManagementPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [isLastPage, setIsLastPage] = useState(false);

  const fetchUsers = async (pageIndex: number) => {
    setLoading(true);
    const { users, lastDoc } = await getAllUsers({
      pageSize: PAGE_SIZE,
      startAfterDoc: pageIndex > 0 ? lastVisible : undefined,
    });
    
    setUserList(users);
    setLastVisible(lastDoc);
    setIsLastPage(users.length < PAGE_SIZE);
    setLoading(false);
  };

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push("/login");
      } else if (!user.isAdmin) {
        router.push("/dashboard");
      } else {
        fetchUsers(currentPage);
      }
    }
  }, [user, userLoading, router]);

  const handleNextPage = () => {
    if (!isLastPage) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      fetchUsers(newPage);
    }
  };

  const handlePreviousPage = () => {
    // This simplified pagination doesn't support "Previous" well without more complex state.
    // For now, we'll just reload the first page. A more robust implementation
    // would store a history of `lastVisible` documents.
    setCurrentPage(0);
    setLastVisible(null);
    fetchUsers(0);
  };


  if (userLoading || !user?.isAdmin) {
    return (
       <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
            <Users2 className="w-8 h-8 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground">
            Loading user data...
          </p>
        </div>
        <Card>
            <CardContent className="pt-6">
                <UserTableSkeleton />
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
            <Users2 className="w-8 h-8 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground">
            View and manage all registered users on the platform.
          </p>
        </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
             <UserTableSkeleton />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                  <TableHeader>
                  <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Premium Status</TableHead>
                      <TableHead>Admin Status</TableHead>
                      <TableHead className="text-right">Joined</TableHead>
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                  {userList.length > 0 ? (
                      userList.map((listUser) => (
                      <TableRow key={listUser.id}>
                          <TableCell>
                              <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                      <AvatarImage src={listUser.photoUrl} />
                                      <AvatarFallback>{listUser.displayName.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium whitespace-nowrap">{listUser.displayName}</span>
                              </div>
                          </TableCell>
                          <TableCell>
                          {listUser.email}
                          </TableCell>
                          <TableCell>
                          {listUser.isPremium ? (
                                  <Badge variant="premium"><Gem className="w-3 h-3 mr-1"/>Premium</Badge>
                          ) : (
                                  <Badge variant="secondary">Standard</Badge>
                          )}
                          </TableCell>
                          <TableCell>
                          {listUser.isAdmin ? (
                                  <Badge variant="secondary"><ShieldCheck className="w-3 h-3 mr-1 text-primary"/>Admin</Badge>
                          ) : (
                                  <Badge variant="outline">User</Badge>
                          )}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                          {listUser.createdAt ? formatDistanceToNow(listUser.createdAt.toDate(), { addSuffix: true }) : 'N/A'}
                          </TableCell>
                      </TableRow>
                      ))
                  ) : (
                      <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                          No users found.
                      </TableCell>
                      </TableRow>
                  )}
                  </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
         <CardDescription className="p-4 border-t">
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                    Page {currentPage + 1}
                </p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 0}>
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNextPage} disabled={isLastPage || loading}>
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>
        </CardDescription>
      </Card>
    </div>
  );
}
