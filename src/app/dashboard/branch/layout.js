import BranchBread from './branchBread';

export default function BranchLayout({ children }) {
  return (
    <div>
      <BranchBread />
      <div>{children}</div>
    </div>
  );
}
