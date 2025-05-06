import { ApolloClient, InMemoryCache, HttpLink, gql } from "@apollo/client";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  
  const { uid, email, subscribeNewsletter, role } = req.body;

  // Adjust the endpoint URL and/or authentication as needed.
  const client = new ApolloClient({
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
      fetch,
    }),
    cache: new InMemoryCache(),
  });

  const COMPLETE_REGISTRATION_MUTATION = gql`
    mutation CompleteRegistration(
      $THuserInput: UserInput!
      $doctorInput: DoctorInput
      $patientInput: PatientInput
    ) {
      completeRegistration(
        THuserInput: $THuserInput
        doctorInput: $doctorInput
        patientInput: $patientInput
      ) {
        id
        email
        role
      }
    }
  `;

  try {
    const variables = {
      THuserInput: { email, role, subscribeNewsletter },
      // Supply doctorInput or patientInput based on role.
      doctorInput: role === "doctor" ? { /* ...doctor-specific fields... */ } : null,
      patientInput: role === "patient" ? { /* ...patient-specific fields... */ } : null,
    };

    const response = await client.mutate({
      mutation: COMPLETE_REGISTRATION_MUTATION,
      variables,
    });

    res.status(200).json(response.data.completeRegistration);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}