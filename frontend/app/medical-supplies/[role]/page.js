export default function MedicalSuppliesPage({ params }) {
  const { role } = params;

  return (
    <div>
      <h1>Medical Supplies Page</h1>
      <p>Role: {role}</p>
      {/* Add your content here */}
    </div>
  );
}
