import { User } from "@prisma/client";
import Link from "next/link";

const VerifyDetails = async ({ friend }: { friend: User | null }) => {
  return friend ? (
    <div>
      <div className="font-semibold text-normal pb-3">Verification pending</div>
      <div className="text-yellow-500 text-sm">
        <div className="mb-2">
          {friend.name} has not signed up yet. <br />
          This message will go away once they signup using the email address
          &apos;
          {friend?.email}&apos;
        </div>
        <Link
          href={`/friends/${friend.id}/edit/contact`}
          className="text-destructive underline"
        >
          <div>If the email id is incorrect, update it here</div>
        </Link>
      </div>
    </div>
  ) : null;
};

export default VerifyDetails;
