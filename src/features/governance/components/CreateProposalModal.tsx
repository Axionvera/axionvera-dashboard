import { useState } from "react";
import { Alert, Button, Dialog, DialogFooter, Input, Textarea } from "@/design-system";

interface CreateProposalModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  createProposalStatus: "idle" | "pending" | "success" | "error";
  createProposalError: string | null;
  onClose: () => void;
  onSubmit: (title: string, description: string) => void;
}

export default function CreateProposalModal({
  isOpen,
  isSubmitting,
  createProposalStatus,
  createProposalError,
  onClose,
  onSubmit,
}: CreateProposalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    onSubmit(title, description);
    if (createProposalStatus === "success") {
      setTitle("");
      setDescription("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} title="Create Proposal" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="proposal-title"
          label="Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter proposal title…"
        />
        <Textarea
          id="proposal-description"
          label="Description"
          required
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your proposal in detail…"
        />

        {createProposalStatus === "error" && createProposalError && (
          <Alert variant="error">{createProposalError}</Alert>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !title.trim() || !description.trim()}
            loading={isSubmitting}
            loadingLabel="Creating proposal…"
          >
            {isSubmitting ? "Creating…" : "Create Proposal"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
