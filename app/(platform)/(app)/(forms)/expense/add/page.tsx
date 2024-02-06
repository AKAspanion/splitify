import { Input } from "@/components/ui/input";

const ExpenseFormPage = () => {
  return (
    <div className="p-6 px-8">
      <form>
        <Input id="desc" name="desc" />
      </form>
    </div>
  );
};

export default ExpenseFormPage;
