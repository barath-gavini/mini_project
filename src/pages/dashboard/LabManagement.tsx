import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/types/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Pencil, Trash2, Monitor, Wind } from "lucide-react";
import { toast } from "sonner";

export default function LabManagement() {
  const [labs, setLabs] = useState<Tables<"labs">[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLab, setEditingLab] =
    useState<Tables<"labs"> | null>(null);

  const fetchLabs = async () => {
    const { data, error } = await supabase
      .from("labs")
      .select("*")
      .order("building")
      .order("name");

    if (error) {
      toast.error("Failed to fetch labs");
    } else {
      setLabs(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const labData: TablesInsert<"labs"> = {
      name: formData.get("name") as string,
      building: formData.get("building") as string,
      capacity: parseInt(formData.get("capacity") as string) || 30,
      has_projector: formData.get("has_projector") === "on",
      has_ac: formData.get("has_ac") === "on",
      is_available: true,
    };

    if (editingLab) {
      const { error } = await supabase
        .from("labs")
        .update(labData)
        .eq("id", editingLab.id);

      if (error) {
        toast.error("Failed to update lab");
      } else {
        toast.success("Lab updated successfully");
        fetchLabs();
        setDialogOpen(false);
        setEditingLab(null);
      }
    } else {
      const { error } = await supabase
        .from("labs")
        .insert(labData);

      if (error) {
        toast.error("Failed to add lab");
      } else {
        toast.success("Lab added successfully");
        fetchLabs();
        setDialogOpen(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lab?")) return;

    const { error } = await supabase
      .from("labs")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete lab");
    } else {
      toast.success("Lab deleted successfully");
      fetchLabs();
    }
  };

  const toggleAvailability = async (
    id: string,
    current: boolean
  ) => {
    const { error } = await supabase
      .from("labs")
      .update({ is_available: !current })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update availability");
    } else {
      fetchLabs();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lab Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage labs and their facilities
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingLab(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Lab
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLab ? "Edit Lab" : "Add New Lab"}
              </DialogTitle>
              <DialogDescription>
                Enter lab details below
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Lab Name</Label>
                <Input
                  name="name"
                  required
                  defaultValue={editingLab?.name}
                />
              </div>

              <div>
                <Label>Building</Label>
                <Input
                  name="building"
                  required
                  defaultValue={editingLab?.building}
                />
              </div>

              <div>
                <Label>Capacity</Label>
                <Input
                  name="capacity"
                  type="number"
                  min={1}
                  required
                  defaultValue={editingLab?.capacity || 30}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Has Projector</Label>
                <Switch
                  name="has_projector"
                  defaultChecked={
                    editingLab?.has_projector ?? true
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Has AC</Label>
                <Switch
                  name="has_ac"
                  defaultChecked={
                    editingLab?.has_ac ?? true
                  }
                />
              </div>

              <DialogFooter>
                <Button type="submit">
                  {editingLab ? "Update" : "Add"} Lab
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Labs</CardTitle>
          <CardDescription>
            List of all labs
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Building</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Facilities</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {labs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No labs found
                  </TableCell>
                </TableRow>
              ) : (
                labs.map((lab) => (
                  <TableRow key={lab.id}>
                    <TableCell className="font-medium">
                      {lab.name}
                    </TableCell>
                    <TableCell>{lab.building}</TableCell>
                    <TableCell>
                      {lab.capacity} seats
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-2">
                        {lab.has_projector && (
                          <Badge variant="outline">
                            <Monitor className="w-3 h-3 mr-1" />
                            Projector
                          </Badge>
                        )}
                        {lab.has_ac && (
                          <Badge variant="outline">
                            <Wind className="w-3 h-3 mr-1" />
                            AC
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        onClick={() =>
                          toggleAvailability(
                            lab.id,
                            lab.is_available ?? true
                          )
                        }
                        style={{ cursor: "pointer" }}
                      >
                        {lab.is_available
                          ? "Available"
                          : "In Use"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingLab(lab);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleDelete(lab.id)
                        }
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
