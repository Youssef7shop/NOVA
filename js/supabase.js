/* ==========================================================================
   SUPABASE CONFIG
========================================================================== */

const SUPABASE_URL =
  "https://qerdrkhjmcussgfkwflo.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_a0u7Sm3eSqg0N8i_49B52w_g44TrK_D";


/* ==========================================================================
   CREATE SUPABASE CLIENT
========================================================================== */

if (
  !window.supabase ||
  typeof window.supabase.createClient !== "function"
) {

  console.error(
    "NOVA: Supabase JavaScript library is not loaded."
  );

} else {

  const supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );


  /* ==========================================================================
     GLOBAL CLIENT
  ========================================================================== */

  window.NOVA_SUPABASE =
    supabaseClient;


  /* ==========================================================================
     NOVA STORAGE
  ========================================================================== */

  window.NOVA_STORAGE = {

    /*
     * Profile avatars bucket
     */
    avatars: "avatars",


    /*
     * Get public URL for a file
     */
    getPublicUrl(
      bucket,
      filePath
    ) {

      const {
        data
      } =
        supabaseClient
          .storage
          .from(bucket)
          .getPublicUrl(filePath);


      return data?.publicUrl || null;

    },


    /*
     * Upload avatar
     */
    async uploadAvatar(
      userId,
      file
    ) {

      if (!userId) {

        throw new Error(
          "User ID is required."
        );

      }


      if (!file) {

        throw new Error(
          "No file selected."
        );

      }


      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
      ];


      if (
        !allowedTypes.includes(
          file.type
        )
      ) {

        throw new Error(
          "Only JPG, PNG and WebP images are allowed."
        );

      }


      const maxSize =
        5 * 1024 * 1024;


      if (
        file.size > maxSize
      ) {

        throw new Error(
          "The image must be smaller than 5 MB."
        );

      }


      let extension =
        "jpg";


      if (
        file.type ===
        "image/png"
      ) {

        extension =
          "png";

      }


      if (
        file.type ===
        "image/webp"
      ) {

        extension =
          "webp";

      }


      const filePath =
        `${userId}/${crypto.randomUUID()}.${extension}`;


      const {
        data,
        error
      } =
        await supabaseClient
          .storage
          .from("avatars")
          .upload(
            filePath,
            file,
            {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type
            }
          );


      if (error) {

        console.error(
          "NOVA Storage upload error:",
          error
        );

        throw error;

      }


      const publicUrl =
        window.NOVA_STORAGE.getPublicUrl(
          "avatars",
          data.path
        );


      if (!publicUrl) {

        throw new Error(
          "Could not generate public image URL."
        );

      }


      return {
        path: data.path,
        publicUrl: publicUrl
      };

    },


    /*
     * Delete an avatar
     */
    async deleteFile(
      filePath
    ) {

      if (!filePath) {
        return;
      }


      const {
        error
      } =
        await supabaseClient
          .storage
          .from("avatars")
          .remove([
            filePath
          ]);


      if (error) {

        console.error(
          "NOVA Storage delete error:",
          error
        );

        throw error;

      }

    }

  };


  /* ==========================================================================
     NOVA DATABASE HELPERS
  ========================================================================== */

  window.NOVA_DB = {

    /*
     * Get current authenticated user
     */
    async getCurrentUser() {

      const {
        data,
        error
      } =
        await supabaseClient
          .auth
          .getUser();


      if (error) {

        throw error;

      }


      return data?.user || null;

    },


    /*
     * Get current user's profile
     */
    async getCurrentProfile() {

      const user =
        await window.NOVA_DB
          .getCurrentUser();


      if (!user) {

        return null;

      }


      const {
        data,
        error
      } =
        await supabaseClient
          .from("profiles")
          .select(`
            id,
            first_name,
            last_name,
            email,
            avatar_url,
            phone,
            country,
            is_email_verified,
            is_active,
            role_id,
            roles (
              name
            )
          `)
          .eq(
            "id",
            user.id
          )
          .single();


      if (error) {

        throw error;

      }


      return data;

    },


    /*
     * Update current profile
     *
     * Uses the secure RPC created
     * in Supabase SQL.
     */
    async updateMyProfile({
      firstName,
      lastName,
      avatarUrl = null,
      phone = null,
      country = null
    }) {

      const {
        data,
        error
      } =
        await supabaseClient
          .rpc(
            "update_my_profile",
            {
              p_first_name:
                firstName,

              p_last_name:
                lastName,

              p_avatar_url:
                avatarUrl,

              p_phone:
                phone,

              p_country:
                country
            }
          );


      if (error) {

        throw error;

      }


      return data;

    }

  };


  /* ==========================================================================
     CONNECTION TEST
  ========================================================================== */

  console.log(
    "NOVA: Supabase initialized successfully."
  );

}